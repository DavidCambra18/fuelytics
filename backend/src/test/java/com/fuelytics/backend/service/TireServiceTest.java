package com.fuelytics.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.fuelytics.backend.dto.TireSetDTO;
import com.fuelytics.backend.entity.*;
import com.fuelytics.backend.entity.enums.TireAxle;
import com.fuelytics.backend.repository.*;

class TireServiceTest {
    private final TireSetRepository tires = mock(TireSetRepository.class);
    private final VehicleRepository vehicles = mock(VehicleRepository.class);
    private final FuelingRepository fuelings = mock(FuelingRepository.class);
    private final TireService service = new TireService(tires, vehicles, fuelings);
    private TireSet previous;

    @BeforeEach
    void setUp() {
        User owner = new User();
        owner.setEmail("owner@example.com");
        Vehicle vehicle = new Vehicle();
        vehicle.setId(1);
        vehicle.setUser(owner);
        vehicle.setOdometer(10000);
        previous = new TireSet();
        previous.setId(5);
        previous.setVehicle(vehicle);
        previous.setAxle(TireAxle.FRONT);
        previous.setActive(true);
        previous.setInstallationOdometer(10000);
        when(vehicles.findByIdForUpdate(1)).thenReturn(Optional.of(vehicle));
        when(tires.findById(5)).thenReturn(Optional.of(previous));
        when(tires.findByVehicleIdAndActiveTrue(1)).thenReturn(List.of(previous));
        when(tires.save(any())).thenAnswer(call -> call.getArgument(0));
    }

    @Test
    void replacementReleasesActiveAxleBeforeInsertingAndUsesLatestOdometer() {
        when(fuelings.findMaxOdometerByVehicleId(1)).thenReturn(25000);
        var response = service.createTireSet(1, installation(20000), "owner@example.com");
        var order = inOrder(tires);
        order.verify(tires).findByVehicleIdAndActiveTrue(1);
        order.verify(tires).save(previous);
        order.verify(tires).flush();
        order.verify(tires).save(argThat(tire -> tire != previous && tire.isActive()));
        assertFalse(previous.isActive());
        assertEquals(20000, previous.getRemovalOdometer());
        assertEquals(5000, response.getCurrentKm());
    }

    @Test
    void invalidReplacementDoesNotDeactivateExistingTires() {
        assertThrows(ResponseStatusException.class,
                () -> service.createTireSet(1, installation(9999), "owner@example.com"));
        assertTrue(previous.isActive());
        verify(tires, never()).save(any());
        verify(tires, never()).flush();
    }

    @Test
    void rejectsInvalidRemovalOdometersWithoutSaving() {
        for (Integer odometer : new Integer[] { null, -1, 9999 }) {
            var error = assertThrows(ResponseStatusException.class,
                    () -> service.deactivateTire(5, odometer, "owner@example.com"));
            assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        }
        assertTrue(previous.isActive());
        verify(tires, never()).save(any());
    }

    @Test
    void removalAtInstallationOdometerIsValid() {
        service.deactivateTire(5, 10000, "owner@example.com");
        assertFalse(previous.isActive());
        assertEquals(10000, previous.getRemovalOdometer());
    }

    @Test
    void otherUserCannotDeactivateTires() {
        var error = assertThrows(ResponseStatusException.class,
                () -> service.deactivateTire(5, 20000, "visitor@example.com"));
        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(tires, never()).save(any());
    }

    private TireSetDTO installation(int odometer) {
        var dto = new TireSetDTO();
        dto.setBrand("Michelin");
        dto.setModel("Primacy");
        dto.setSize("205/55 R16");
        dto.setAxle(TireAxle.FRONT);
        dto.setInstallationDate(LocalDate.of(2026, 10, 21));
        dto.setInstallationOdometer(odometer);
        return dto;
    }
}
