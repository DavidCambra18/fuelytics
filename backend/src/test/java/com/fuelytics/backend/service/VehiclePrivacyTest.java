package com.fuelytics.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import com.fuelytics.backend.entity.User;
import com.fuelytics.backend.entity.Vehicle;
import com.fuelytics.backend.repository.*;

class VehiclePrivacyTest {
    private final VehicleRepository vehicles = mock(VehicleRepository.class);
    private final VehicleService service = new VehicleService(vehicles, mock(UserRepository.class),
            mock(FuelingRepository.class), mock(ExpenseRepository.class), new ConsumptionCalculator());
    private Vehicle vehicle;

    @BeforeEach
    void setUp() {
        User owner = new User();
        owner.setEmail("owner@example.com");
        vehicle = new Vehicle();
        vehicle.setId(1);
        vehicle.setUser(owner);
        vehicle.setIsPublic(true);
        vehicle.setShowFuelData(false);
        vehicle.setShowStatistics(false);
        vehicle.setAvgConsumption(7.25);
        vehicle.setFuelEntriesCount(8);
        when(vehicles.findById(1)).thenReturn(Optional.of(vehicle));
    }

    @Test
    void anonymousAndOtherUsersCannotReadHiddenStatistics() {
        for (String email : new String[] { null, "visitor@example.com" }) {
            var response = service.getVehicleById(1, email);
            assertNull(response.getAvgConsumption());
            assertNull(response.getFuelEntriesCount());
        }
        assertEquals(7.25, vehicle.getAvgConsumption());
    }

    @Test
    void ownerKeepsAccessToHiddenStatistics() {
        var response = service.getVehicleById(1, "owner@example.com");
        assertEquals(7.25, response.getAvgConsumption());
        assertEquals(8, response.getFuelEntriesCount());
    }

    @Test
    void sharingFuelHistoryDoesNotOverrideHiddenStatistics() {
        vehicle.setShowFuelData(true);
        var response = service.getVehicleById(1, null);
        assertNull(response.getAvgConsumption());
        assertEquals(8, response.getFuelEntriesCount());
    }

    @Test
    void explicitlySharedStatisticsRemainAvailable() {
        vehicle.setShowStatistics(true);
        var response = service.getVehicleById(1, null);
        assertEquals(7.25, response.getAvgConsumption());
        assertEquals(8, response.getFuelEntriesCount());
    }

    @Test
    void privateVehicleRemainsInaccessible() {
        vehicle.setIsPublic(false);
        assertThrows(ResponseStatusException.class, () -> service.getVehicleById(1, null));
    }
}
