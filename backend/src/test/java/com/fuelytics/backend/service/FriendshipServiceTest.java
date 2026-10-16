package com.fuelytics.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.data.domain.PageRequest;

import com.fuelytics.backend.entity.Friendship;
import com.fuelytics.backend.entity.User;
import com.fuelytics.backend.entity.enums.FriendshipStatus;
import com.fuelytics.backend.repository.FriendshipRepository;
import com.fuelytics.backend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class FriendshipServiceTest {

    @Mock
    private FriendshipRepository friendshipRepository;

    @Mock
    private UserRepository userRepository;

    private FriendshipService friendshipService;
    private User currentUser;
    private User otherUser;

    @BeforeEach
    void setUp() {
        friendshipService = new FriendshipService(friendshipRepository, userRepository);
        currentUser = user(1, "current", "current@example.com");
        otherUser = user(2, "friend", "friend@example.com");
        when(userRepository.findByEmail(currentUser.getEmail())).thenReturn(currentUser);
    }

    @Test
    void cannotSendRequestToSelf() {
        when(userRepository.findByUsername(currentUser.getUsername())).thenReturn(currentUser);

        assertThrows(ResponseStatusException.class,
                () -> friendshipService.sendRequest(currentUser.getEmail(), currentUser.getUsername()));
        verify(friendshipRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void onlyRecipientCanAcceptPendingRequest() {
        Friendship friendship = friendship(currentUser, otherUser, FriendshipStatus.PENDING);
        when(friendshipRepository.findByIdForUpdate(8)).thenReturn(Optional.of(friendship));

        assertThrows(ResponseStatusException.class,
                () -> friendshipService.acceptRequest(currentUser.getEmail(), 8));
        assertEquals(FriendshipStatus.PENDING, friendship.getStatus());
    }

    @Test
    void acceptingRequestMakesUsersFriends() {
        Friendship friendship = friendship(otherUser, currentUser, FriendshipStatus.PENDING);
        when(friendshipRepository.findByIdForUpdate(8)).thenReturn(Optional.of(friendship));
        when(friendshipRepository.save(friendship)).thenReturn(friendship);

        var result = friendshipService.acceptRequest(currentUser.getEmail(), 8);

        assertEquals(FriendshipStatus.ACCEPTED, friendship.getStatus());
        assertEquals("friend", result.username());
        assertEquals("ACCEPTED", result.status());
    }

    @Test
    void overviewSeparatesFriendsAndPendingRequests() {
        Friendship accepted = friendship(currentUser, otherUser, FriendshipStatus.ACCEPTED);
        User sender = user(3, "sender", "sender@example.com");
        Friendship incoming = friendship(sender, currentUser, FriendshipStatus.PENDING);
        User recipient = user(4, "recipient", "recipient@example.com");
        Friendship outgoing = friendship(currentUser, recipient, FriendshipStatus.PENDING);
        Friendship rejected = friendship(currentUser, user(5, "rejected", "rejected@example.com"), FriendshipStatus.REJECTED);
        when(friendshipRepository.findAllForUser(currentUser.getId()))
                .thenReturn(List.of(accepted, incoming, outgoing, rejected));

        var overview = friendshipService.getOverview(currentUser.getEmail());

        assertEquals(List.of("friend"), overview.friends().stream().map(item -> item.username()).toList());
        assertEquals(List.of("sender"), overview.incomingRequests().stream().map(item -> item.username()).toList());
        assertEquals(List.of("recipient"), overview.outgoingRequests().stream().map(item -> item.username()).toList());
    }

    @Test
    void requestIsCreatedWithPendingStatus() {
        when(userRepository.findByUsername("friend")).thenReturn(otherUser);
        when(friendshipRepository.findBetweenUsersForUpdate(1, 2)).thenReturn(Optional.empty());
        when(friendshipRepository.save(org.mockito.ArgumentMatchers.any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var result = friendshipService.sendRequest(currentUser.getEmail(), " friend ");

        assertEquals("PENDING", result.status());
        assertEquals("OUTGOING", result.direction());
        assertEquals("friend", result.username());
    }

    @Test
    void cannotSendDuplicateOrReversePendingRequest() {
        when(userRepository.findByUsername("friend")).thenReturn(otherUser);
        Friendship outgoing = friendship(currentUser, otherUser, FriendshipStatus.PENDING);
        Friendship incoming = friendship(otherUser, currentUser, FriendshipStatus.PENDING);
        when(friendshipRepository.findBetweenUsersForUpdate(1, 2))
                .thenReturn(Optional.of(outgoing), Optional.of(incoming));

        for (int attempt = 0; attempt < 2; attempt++) {
            var error = assertThrows(ResponseStatusException.class,
                    () -> friendshipService.sendRequest(currentUser.getEmail(), "friend"));
            assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        }
        verify(friendshipRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void cannotSendRequestToExistingFriend() {
        when(userRepository.findByUsername("friend")).thenReturn(otherUser);
        when(friendshipRepository.findBetweenUsersForUpdate(1, 2))
                .thenReturn(Optional.of(friendship(otherUser, currentUser, FriendshipStatus.ACCEPTED)));

        var error = assertThrows(ResponseStatusException.class,
                () -> friendshipService.sendRequest(currentUser.getEmail(), "friend"));
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
    }

    @Test
    void rejectedRequestCanBeSentAgainInOppositeDirection() {
        Friendship rejected = friendship(otherUser, currentUser, FriendshipStatus.REJECTED);
        when(userRepository.findByUsername("friend")).thenReturn(otherUser);
        when(friendshipRepository.findBetweenUsersForUpdate(1, 2)).thenReturn(Optional.of(rejected));
        when(friendshipRepository.save(rejected)).thenReturn(rejected);

        var result = friendshipService.sendRequest(currentUser.getEmail(), "friend");

        assertEquals(currentUser, rejected.getRequester());
        assertEquals(otherUser, rejected.getAddressee());
        assertEquals("PENDING", result.status());
    }

    @Test
    void recipientCanRejectRequest() {
        Friendship pending = friendship(otherUser, currentUser, FriendshipStatus.PENDING);
        when(friendshipRepository.findByIdForUpdate(8)).thenReturn(Optional.of(pending));
        when(friendshipRepository.save(pending)).thenReturn(pending);

        assertEquals("REJECTED", friendshipService.rejectRequest(currentUser.getEmail(), 8).status());
    }

    @Test
    void senderCannotRejectTheirOwnRequest() {
        Friendship pending = friendship(currentUser, otherUser, FriendshipStatus.PENDING);
        when(friendshipRepository.findByIdForUpdate(8)).thenReturn(Optional.of(pending));

        var error = assertThrows(ResponseStatusException.class,
                () -> friendshipService.rejectRequest(currentUser.getEmail(), 8));
        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
    }

    @Test
    void cannotRespondToRequestThatIsAlreadyResolved() {
        Friendship accepted = friendship(otherUser, currentUser, FriendshipStatus.ACCEPTED);
        when(friendshipRepository.findByIdForUpdate(8)).thenReturn(Optional.of(accepted));

        var error = assertThrows(ResponseStatusException.class,
                () -> friendshipService.rejectRequest(currentUser.getEmail(), 8));
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertEquals(FriendshipStatus.ACCEPTED, accepted.getStatus());
    }

    @Test
    void thirdPartyCannotDeleteFriendship() {
        Friendship unrelated = friendship(otherUser, user(3, "third", "third@example.com"), FriendshipStatus.ACCEPTED);
        when(friendshipRepository.findByIdForUpdate(8)).thenReturn(Optional.of(unrelated));

        var error = assertThrows(ResponseStatusException.class,
                () -> friendshipService.deleteFriendship(currentUser.getEmail(), 8));
        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(friendshipRepository, never()).delete(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void eitherParticipantCanRemoveFriendship() {
        Friendship outgoing = friendship(currentUser, otherUser, FriendshipStatus.ACCEPTED);
        Friendship incoming = friendship(otherUser, currentUser, FriendshipStatus.ACCEPTED);
        when(friendshipRepository.findByIdForUpdate(8)).thenReturn(Optional.of(outgoing), Optional.of(incoming));

        friendshipService.deleteFriendship(currentUser.getEmail(), 8);
        friendshipService.deleteFriendship(currentUser.getEmail(), 8);

        verify(friendshipRepository).delete(outgoing);
        verify(friendshipRepository).delete(incoming);
    }

    @Test
    void missingRequestReturnsNotFound() {
        when(friendshipRepository.findByIdForUpdate(8)).thenReturn(Optional.empty());
        var error = assertThrows(ResponseStatusException.class,
                () -> friendshipService.acceptRequest(currentUser.getEmail(), 8));
        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
    }

    @Test
    void privateNameIsHiddenEvenFromAcceptedFriends() {
        otherUser.setProfilePublic(false);
        otherUser.setFirstName("Private");
        otherUser.setLastName("Name");
        when(friendshipRepository.findAllForUser(1))
                .thenReturn(List.of(friendship(currentUser, otherUser, FriendshipStatus.ACCEPTED)));

        var friend = friendshipService.getOverview(currentUser.getEmail()).friends().get(0);

        assertNull(friend.firstName());
        assertNull(friend.lastName());
        assertEquals("friend", friend.username());
    }

    @Test
    void searchReturnsRelationshipAndHidesPrivateNames() {
        otherUser.setProfilePublic(false);
        otherUser.setFirstName("Private");
        when(userRepository.searchByUsername("fr", 1, PageRequest.of(0, 8))).thenReturn(List.of(otherUser));
        when(friendshipRepository.findBetweenUsers(1, 2)).thenReturn(Optional.empty());

        var result = friendshipService.searchUsers(currentUser.getEmail(), " fr ").get(0);

        assertEquals("friend", result.username());
        assertEquals("NONE", result.status());
        assertNull(result.firstName());
    }

    @Test
    void searchRejectsTooShortAndTooLongQueries() {
        for (String query : List.of("f", "thisusernameistoolong")) {
            var error = assertThrows(ResponseStatusException.class,
                    () -> friendshipService.searchUsers(currentUser.getEmail(), query));
            assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        }
    }

    @Test
    void thirdPartyCannotAcceptOrRejectPendingRequest() {
        Friendship unrelated = friendship(otherUser, user(3, "third", "third@example.com"), FriendshipStatus.PENDING);
        when(friendshipRepository.findByIdForUpdate(8)).thenReturn(Optional.of(unrelated));

        var acceptError = assertThrows(ResponseStatusException.class,
                () -> friendshipService.acceptRequest(currentUser.getEmail(), 8));
        var rejectError = assertThrows(ResponseStatusException.class,
                () -> friendshipService.rejectRequest(currentUser.getEmail(), 8));

        assertEquals(HttpStatus.FORBIDDEN, acceptError.getStatusCode());
        assertEquals(HttpStatus.FORBIDDEN, rejectError.getStatusCode());
        assertEquals(FriendshipStatus.PENDING, unrelated.getStatus());
        verify(friendshipRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void senderCanCancelPendingRequest() {
        Friendship pending = friendship(currentUser, otherUser, FriendshipStatus.PENDING);
        when(friendshipRepository.findByIdForUpdate(8)).thenReturn(Optional.of(pending));

        friendshipService.deleteFriendship(currentUser.getEmail(), 8);

        verify(friendshipRepository).delete(pending);
    }

    @Test
    void searchIdentifiesIncomingRequestInsteadOfOfferingToSendAnother() {
        when(userRepository.searchByUsername("fr", 1, PageRequest.of(0, 8))).thenReturn(List.of(otherUser));
        when(friendshipRepository.findBetweenUsers(1, 2))
                .thenReturn(Optional.of(friendship(otherUser, currentUser, FriendshipStatus.PENDING)));

        var result = friendshipService.searchUsers(currentUser.getEmail(), "fr").get(0);

        assertEquals("PENDING", result.status());
        assertEquals("INCOMING", result.direction());
        assertEquals(8, result.friendshipId());
        assertEquals("friend", result.username());
    }

    private User user(int id, String username, String email) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setEmail(email);
        return user;
    }

    private Friendship friendship(User requester, User addressee, FriendshipStatus status) {
        Friendship friendship = new Friendship();
        ReflectionTestUtils.setField(friendship, "id", 8);
        friendship.setRequester(requester);
        friendship.setAddressee(addressee);
        friendship.setStatus(status);
        return friendship;
    }
}
