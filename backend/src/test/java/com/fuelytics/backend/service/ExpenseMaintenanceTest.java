package com.fuelytics.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import com.fuelytics.backend.dto.ExpenseDTO;
import com.fuelytics.backend.entity.*;
import com.fuelytics.backend.entity.enums.ExpenseType;
import com.fuelytics.backend.repository.*;

class ExpenseMaintenanceTest {
    private final ExpenseRepository expenses = mock(ExpenseRepository.class);
    private final VehicleRepository vehicles = mock(VehicleRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final MaintenanceReminderService reminders = mock(MaintenanceReminderService.class);
    private final ExpenseService service = new ExpenseService(expenses, vehicles, users,
            mock(TireSetRepository.class), mock(BadgeService.class), reminders, mock(MaintenanceReminderRepository.class));
    private Vehicle vehicle;

    @BeforeEach
    void setUp() {
        var user = new User();
        user.setId(1);
        vehicle = new Vehicle();
        vehicle.setId(1);
        vehicle.setUser(user);
        when(users.findByEmailForUpdate("owner@example.com")).thenReturn(user);
        when(vehicles.findByIdForUpdate(1)).thenReturn(Optional.of(vehicle));
        when(expenses.save(any(Expense.class))).thenAnswer(call -> call.getArgument(0));
    }

    private ExpenseDTO request(ExpenseType type, Integer km) {
        var dto = new ExpenseDTO();
        dto.setVehicleId(1);
        dto.setType(type);
        dto.setDate(LocalDate.of(2026, 1, 1));
        dto.setCost(new BigDecimal("80.00"));
        dto.setNextMaintenanceKm(km);
        dto.setNextMaintenanceDate(LocalDate.of(2027, 1, 1));
        return dto;
    }

    @Test
    void maintenanceKeepsItsSchedule() {
        var result = service.createExpense(request(ExpenseType.maintenance, 110000), "owner@example.com");
        assertEquals(110000, result.getNextMaintenanceKm());
        assertEquals(LocalDate.of(2027, 1, 1), result.getNextMaintenanceDate());
    }

    @Test
    void nonMaintenanceCreationIgnoresHiddenScheduleFields() {
        var result = service.createExpense(request(ExpenseType.insurance, 110000), "owner@example.com");
        assertNull(result.getNextMaintenanceKm());
        assertNull(result.getNextMaintenanceDate());
    }

    @Test
    void changingCategoryRemovesTheObsoleteReminder() {
        var expense = new Expense();
        expense.setVehicle(vehicle);
        expense.setType(ExpenseType.maintenance);
        expense.setNextMaintenanceKm(110000);
        expense.setNextMaintenanceDate(LocalDate.of(2027, 1, 1));
        when(expenses.findById(10)).thenReturn(Optional.of(expense));
        var result = service.updateExpense(10, request(ExpenseType.repair, 110000), "owner@example.com");
        assertEquals(ExpenseType.repair, result.getType());
        assertNull(result.getNextMaintenanceKm());
        assertNull(result.getNextMaintenanceDate());
        assertEquals(new BigDecimal("80.00"), result.getCost());
    }

    @Test
    void zeroKmMeansNoDistanceConditionWithoutDiscardingDate() {
        var result = service.createExpense(request(ExpenseType.maintenance, 0), "owner@example.com");
        assertNull(result.getNextMaintenanceKm());
        assertEquals(LocalDate.of(2027, 1, 1), result.getNextMaintenanceDate());
    }

    @Test
    void creatingAMaintenanceDoesNotSilentlyCloseOtherExpenses() {
        service.createExpense(request(ExpenseType.maintenance, 110000), "owner@example.com");
        var captured = ArgumentCaptor.forClass(Expense.class);
        verify(expenses).save(captured.capture());
        assertEquals(110000, captured.getValue().getNextMaintenanceKm());
        verifyNoMoreInteractions(expenses);
    }

    @Test
    void creatingMaintenanceForwardsOnlyTheExplicitReminder() {
        var dto = request(ExpenseType.maintenance, null);
        dto.setMaintenanceReminderId(42);
        service.createExpense(dto, "owner@example.com");
        verify(reminders).syncExpenseLink(any(Expense.class), eq(42));
    }

    private Expense existingMaintenance() {
        var expense = new Expense();
        expense.setId(10);
        expense.setVehicle(vehicle);
        expense.setType(ExpenseType.maintenance);
        when(expenses.findById(10)).thenReturn(Optional.of(expense));
        return expense;
    }

    @Test
    void legacyClientOmittingTheReminderPreservesItsAssociation() {
        existingMaintenance();
        service.updateExpense(10, request(ExpenseType.maintenance, null), "owner@example.com");
        verifyNoInteractions(reminders);
    }

    @Test
    void explicitNullReopensTheAssociatedReminder() {
        var expense = existingMaintenance();
        var dto = request(ExpenseType.maintenance, null);
        dto.setMaintenanceReminderId(null);
        service.updateExpense(10, dto, "owner@example.com");
        verify(reminders).syncExpenseLink(expense, null);
    }

    @Test
    void changingCategoryReopensTheAssociatedReminder() {
        var expense = existingMaintenance();
        service.updateExpense(10, request(ExpenseType.insurance, null), "owner@example.com");
        verify(reminders).syncExpenseLink(expense, null);
    }

    @Test
    void deletingExpenseUnlinksReminderBeforeRemovingHistory() {
        var expense = existingMaintenance();
        service.deleteExpense(10, "owner@example.com");
        var order = inOrder(reminders, expenses);
        order.verify(reminders).syncExpenseLink(expense, null);
        order.verify(expenses).deleteById(10);
    }
}
