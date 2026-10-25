package com.fuelytics.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import com.fuelytics.backend.entity.*;
import com.fuelytics.backend.entity.enums.ExpenseType;
import com.fuelytics.backend.repository.*;

class MaintenanceAlertsTest {
    private final VehicleRepository vehicles = mock(VehicleRepository.class);
    private final FuelingRepository fuelings = mock(FuelingRepository.class);
    private final ExpenseRepository expenses = mock(ExpenseRepository.class);
    private final VehicleService service = new VehicleService(vehicles, mock(UserRepository.class),
            fuelings, expenses, new ConsumptionCalculator());
    private Vehicle vehicle;

    @BeforeEach
    void setUp() {
        var owner = new User();
        owner.setEmail("owner@example.com");
        vehicle = new Vehicle();
        vehicle.setId(1);
        vehicle.setUser(owner);
        vehicle.setOdometer(100000);
        when(vehicles.findById(1)).thenReturn(Optional.of(vehicle));
    }

    private Expense scheduled(int id, ExpenseType type, Integer km, LocalDate date) {
        var expense = new Expense();
        expense.setId(id);
        expense.setVehicle(vehicle);
        expense.setType(type);
        expense.setDescription("Cambio de aceite");
        expense.setCost(new BigDecimal("89.50"));
        expense.setDate(LocalDate.of(2025, 1, 1));
        expense.setNextMaintenanceKm(km);
        expense.setNextMaintenanceDate(date);
        return expense;
    }

    @Test
    void hiddenSchedulesOnOtherExpenseCategoriesDoNotGenerateAlerts() {
        when(expenses.findByVehicleIdOrderByDateDesc(1)).thenReturn(List.of(
                scheduled(1, ExpenseType.insurance, 100500, LocalDate.now()),
                scheduled(2, ExpenseType.repair, 100500, null),
                scheduled(3, ExpenseType.maintenance, 102000, null)));
        var alerts = service.getVehicleAlerts(1, "owner@example.com");
        assertEquals(1, alerts.size());
        assertEquals(3, alerts.get(0).getExpenseId());
    }

    @Test
    void dateOnlyReminderWithLegacyZeroKmIsNotOverdueByDistance() {
        when(expenses.findByVehicleIdOrderByDateDesc(1)).thenReturn(List.of(
                scheduled(1, ExpenseType.maintenance, 0, LocalDate.now().plusDays(60))));
        var alert = service.getVehicleAlerts(1, "owner@example.com").get(0);
        assertNull(alert.getRemainingKm());
        assertEquals(60L, alert.getRemainingDays());
        assertEquals("OK", alert.getUrgency());
    }

    @Test
    void distanceUsesTheGreaterOfVehicleAndFuelingOdometers() {
        when(fuelings.findMaxOdometerByVehicleId(1)).thenReturn(105000);
        when(expenses.findByVehicleIdOrderByDateDesc(1)).thenReturn(List.of(
                scheduled(1, ExpenseType.maintenance, 105500, null)));
        var alert = service.getVehicleAlerts(1, "owner@example.com").get(0);
        assertEquals(500, alert.getRemainingKm());
        assertEquals("CRITICAL", alert.getUrgency());
        when(fuelings.findMaxOdometerByVehicleId(1)).thenReturn(90000);
        assertEquals(5500, service.getVehicleAlerts(1, "owner@example.com").get(0).getRemainingKm());
    }

    @Test
    void whicheverDueConditionArrivesFirstDeterminesUrgency() {
        when(expenses.findByVehicleIdOrderByDateDesc(1)).thenReturn(List.of(
                scheduled(1, ExpenseType.maintenance, 110000, LocalDate.now().minusDays(1)),
                scheduled(2, ExpenseType.maintenance, 101200, LocalDate.now().plusDays(60)),
                scheduled(3, ExpenseType.maintenance, null, LocalDate.now().plusDays(30))));
        var alerts = service.getVehicleAlerts(1, "owner@example.com");
        assertEquals(List.of("CRITICAL", "WARNING", "WARNING"), alerts.stream().map(a -> a.getUrgency()).toList());
    }

    @Test
    void closingReminderPreservesHistoricalExpenseAndOtherReminders() {
        var original = scheduled(1, ExpenseType.maintenance, 101000, LocalDate.now());
        var other = scheduled(2, ExpenseType.maintenance, 102000, null);
        when(expenses.findById(1)).thenReturn(Optional.of(original));
        service.completeAlert(1, 1, "owner@example.com");
        assertNull(original.getNextMaintenanceKm());
        assertNull(original.getNextMaintenanceDate());
        assertEquals(new BigDecimal("89.50"), original.getCost());
        assertEquals(LocalDate.of(2025, 1, 1), original.getDate());
        assertEquals(102000, other.getNextMaintenanceKm());
        verify(expenses).save(original);
        verify(expenses, never()).delete(any());
    }

    @Test
    void onlyOwnerCanReadOrCloseTheirReminders() {
        assertEquals(403, assertThrows(ResponseStatusException.class,
                () -> service.getVehicleAlerts(1, "visitor@example.com")).getStatusCode().value());
        assertEquals(403, assertThrows(ResponseStatusException.class,
                () -> service.completeAlert(1, 1, "visitor@example.com")).getStatusCode().value());
        verifyNoInteractions(expenses);
    }

    @Test
    void cannotCloseAnExpenseFromAnotherVehicle() {
        var expense = scheduled(1, ExpenseType.maintenance, 101000, null);
        var otherVehicle = new Vehicle();
        otherVehicle.setId(2);
        expense.setVehicle(otherVehicle);
        when(expenses.findById(1)).thenReturn(Optional.of(expense));
        assertEquals(400, assertThrows(ResponseStatusException.class,
                () -> service.completeAlert(1, 1, "owner@example.com")).getStatusCode().value());
        verify(expenses, never()).save(any());
    }
}
