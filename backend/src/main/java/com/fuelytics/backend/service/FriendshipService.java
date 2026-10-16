package com.fuelytics.backend.service;

import java.util.Comparator;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fuelytics.backend.dto.FriendshipOverviewDTO;
import com.fuelytics.backend.dto.FriendshipUserDTO;
import com.fuelytics.backend.entity.Friendship;
import com.fuelytics.backend.entity.User;
import com.fuelytics.backend.entity.enums.FriendshipStatus;
import com.fuelytics.backend.repository.FriendshipRepository;
import com.fuelytics.backend.repository.UserRepository;

@Service
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    public FriendshipService(FriendshipRepository friendshipRepository, UserRepository userRepository) {
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public FriendshipOverviewDTO getOverview(String email) {
        User currentUser = requireUserByEmail(email);
        List<Friendship> relationships = friendshipRepository.findAllForUser(currentUser.getId());

        List<FriendshipUserDTO> friends = relationships.stream()
                .filter(friendship -> friendship.getStatus() == FriendshipStatus.ACCEPTED)
                .map(friendship -> toDTO(friendship, currentUser))
                .sorted(byUsername())
                .toList();
        List<FriendshipUserDTO> incoming = relationships.stream()
                .filter(friendship -> friendship.getStatus() == FriendshipStatus.PENDING)
                .filter(friendship -> friendship.getAddressee().getId().equals(currentUser.getId()))
                .map(friendship -> toDTO(friendship, currentUser))
                .toList();
        List<FriendshipUserDTO> outgoing = relationships.stream()
                .filter(friendship -> friendship.getStatus() == FriendshipStatus.PENDING)
                .filter(friendship -> friendship.getRequester().getId().equals(currentUser.getId()))
                .map(friendship -> toDTO(friendship, currentUser))
                .toList();

        return new FriendshipOverviewDTO(friends, incoming, outgoing);
    }

    @Transactional(readOnly = true)
    public List<FriendshipUserDTO> searchUsers(String email, String username) {
        User currentUser = requireUserByEmail(email);
        String query = username == null ? "" : username.trim();

        if (query.length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Escribe al menos 2 caracteres para buscar usuarios");
        }
        if (query.length() > 15) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El nombre de usuario no puede superar los 15 caracteres");
        }

        return userRepository.searchByUsername(query, currentUser.getId(), PageRequest.of(0, 8)).stream()
                .map(user -> friendshipRepository.findBetweenUsers(currentUser.getId(), user.getId())
                        .map(friendship -> toDTO(friendship, currentUser))
                        .orElseGet(() -> new FriendshipUserDTO(
                                null,
                                user.getUsername(),
                                Boolean.TRUE.equals(user.getProfilePublic()) ? user.getFirstName() : null,
                                Boolean.TRUE.equals(user.getProfilePublic()) ? user.getLastName() : null,
                                "NONE",
                                "NONE")))
                .toList();
    }

    @Transactional
    public FriendshipUserDTO sendRequest(String email, String username) {
        User requester = requireUserByEmail(email);
        User addressee = userRepository.findByUsername(username == null ? "" : username.trim());

        if (addressee == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
        }
        if (requester.getId().equals(addressee.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No puedes enviarte una solicitud de amistad");
        }

        Friendship friendship = friendshipRepository.findBetweenUsersForUpdate(requester.getId(), addressee.getId())
                .orElseGet(Friendship::new);

        if (friendship.getId() != null && friendship.getStatus() == FriendshipStatus.ACCEPTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este usuario ya está en tu lista de amigos");
        }
        if (friendship.getId() != null && friendship.getStatus() == FriendshipStatus.PENDING) {
            String message = friendship.getRequester().getId().equals(requester.getId())
                    ? "Ya has enviado una solicitud a este usuario"
                    : "Este usuario ya te ha enviado una solicitud";
            throw new ResponseStatusException(HttpStatus.CONFLICT, message);
        }

        friendship.setRequester(requester);
        friendship.setAddressee(addressee);
        friendship.setStatus(FriendshipStatus.PENDING);
        return toDTO(friendshipRepository.save(friendship), requester);
    }

    @Transactional
    public FriendshipUserDTO acceptRequest(String email, Integer friendshipId) {
        User currentUser = requireUserByEmail(email);
        Friendship friendship = requireLockedFriendship(friendshipId);
        requirePendingRecipient(friendship, currentUser);
        friendship.setStatus(FriendshipStatus.ACCEPTED);
        return toDTO(friendshipRepository.save(friendship), currentUser);
    }

    @Transactional
    public FriendshipUserDTO rejectRequest(String email, Integer friendshipId) {
        User currentUser = requireUserByEmail(email);
        Friendship friendship = requireLockedFriendship(friendshipId);
        requirePendingRecipient(friendship, currentUser);
        friendship.setStatus(FriendshipStatus.REJECTED);
        return toDTO(friendshipRepository.save(friendship), currentUser);
    }

    @Transactional
    public void deleteFriendship(String email, Integer friendshipId) {
        User currentUser = requireUserByEmail(email);
        Friendship friendship = requireLockedFriendship(friendshipId);

        if (!isParticipant(friendship, currentUser)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "No puedes modificar esta relación de amistad");
        }
        friendshipRepository.delete(friendship);
    }

    private User requireUserByEmail(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
        }
        return user;
    }

    private Friendship requireLockedFriendship(Integer friendshipId) {
        return friendshipRepository.findByIdForUpdate(friendshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Solicitud de amistad no encontrada"));
    }

    private void requirePendingRecipient(Friendship friendship, User currentUser) {
        if (!friendship.getAddressee().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Solo el receptor puede responder a esta solicitud");
        }
        if (friendship.getStatus() != FriendshipStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Esta solicitud ya no está pendiente");
        }
    }

    private boolean isParticipant(Friendship friendship, User user) {
        return friendship.getRequester().getId().equals(user.getId())
                || friendship.getAddressee().getId().equals(user.getId());
    }

    private FriendshipUserDTO toDTO(Friendship friendship, User currentUser) {
        boolean sentByCurrentUser = friendship.getRequester().getId().equals(currentUser.getId());
        User otherUser = sentByCurrentUser ? friendship.getAddressee() : friendship.getRequester();
        boolean showName = Boolean.TRUE.equals(otherUser.getProfilePublic());
        return new FriendshipUserDTO(
                friendship.getId(),
                otherUser.getUsername(),
                showName ? otherUser.getFirstName() : null,
                showName ? otherUser.getLastName() : null,
                friendship.getStatus().name(),
                sentByCurrentUser ? "OUTGOING" : "INCOMING");
    }

    private Comparator<FriendshipUserDTO> byUsername() {
        return Comparator.comparing(FriendshipUserDTO::username, String.CASE_INSENSITIVE_ORDER);
    }
}
