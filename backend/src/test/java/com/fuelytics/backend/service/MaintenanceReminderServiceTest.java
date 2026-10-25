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
import com.fuelytics.backend.dto.*;
import com.fuelytics.backend.entity.*;
import com.fuelytics.backend.entity.enums.ExpenseType;
import com.fuelytics.backend.repository.*;
import jakarta.validation.Validation;

class MaintenanceReminderServiceTest {
    private final MaintenanceReminderRepository reminders = mock(MaintenanceReminderRepository.class);
    private final VehicleRepository vehicles = mock(VehicleRepository.class);
    private final ExpenseRepository expenses = mock(ExpenseRepository.class);
    private final FuelingRepository fuelings = mock(FuelingRepository.class);
    private final MaintenanceReminderService service = new MaintenanceReminderService(reminders, vehicles, expenses, fuelings);
    private Vehicle vehicle;
    private MaintenanceReminder reminder;
    private Expense expense;

    @BeforeEach
    void setUp() {
        var user = new User(); user.setId(1); user.setEmail("owner@example.com");
        vehicle = new Vehicle(); vehicle.setId(1); vehicle.setUser(user); vehicle.setOdometer(100000); vehicle.setIsPublic(true);
        reminder = new MaintenanceReminder(); reminder.setId(10); reminder.setVehicle(vehicle); reminder.setTitle("Aceite"); reminder.setTargetOdometer(101000);
        expense = new Expense(); expense.setId(20); expense.setVehicle(vehicle); expense.setType(ExpenseType.maintenance);
        expense.setDate(LocalDate.of(2026, 1, 1)); expense.setCost(new BigDecimal("85.50"));
        when(vehicles.findById(1)).thenReturn(Optional.of(vehicle));
        when(vehicles.findByIdForUpdate(1)).thenReturn(Optional.of(vehicle));
        when(reminders.findById(10)).thenReturn(Optional.of(reminder));
        when(reminders.save(any(MaintenanceReminder.class))).thenAnswer(call -> call.getArgument(0));
        when(expenses.findById(20)).thenReturn(Optional.of(expense));
    }

    @Test void createsAnIndependentPendingReminderWithoutWritingAnExpense() {
        var dto = service.save(1, null, new MaintenanceReminderDTO(" Revisión ", " Nota ", null, LocalDate.now().plusDays(60)), "owner@example.com");
        assertEquals("Revisión", dto.title()); assertEquals("Nota", dto.notes());
        assertEquals("PENDING", dto.status()); assertNull(dto.expenseId()); assertEquals("OK", dto.urgency());
        verifyNoInteractions(expenses);
    }

    @Test void publicVehicleDoesNotExposeRemindersToOtherPeople() {
        for (String visitor : new String[] { null, "visitor@example.com" }) {
            assertEquals(403, assertThrows(ResponseStatusException.class, () -> service.list(1, visitor)).getStatusCode().value());
            assertEquals(403, assertThrows(ResponseStatusException.class, () -> service.complete(1, 10, 20, visitor)).getStatusCode().value());
            assertEquals(403, assertThrows(ResponseStatusException.class, () -> service.delete(1, 10, visitor)).getStatusCode().value());
        }
        verifyNoInteractions(reminders, expenses);
    }

    @Test void linksMaintenanceAndExposesItsConfirmedDateAndCost() {
        var dto = service.complete(1, 10, 20, "owner@example.com");
        assertEquals("COMPLETED", dto.status()); assertEquals(20, dto.expenseId());
        assertEquals(expense.getDate(), dto.completedDate()); assertEquals(expense.getCost(), dto.completedCost());
        assertSame(expense, reminder.getCompletedExpense()); verify(expenses, never()).save(any());
    }

    @Test void rejectsAnotherCategoryAndAnotherVehicle() {
        expense.setType(ExpenseType.insurance);
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> service.complete(1, 10, 20, "owner@example.com")).getStatusCode().value());
        expense.setType(ExpenseType.maintenance); var other = new Vehicle(); other.setId(2); expense.setVehicle(other);
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> service.complete(1, 10, 20, "owner@example.com")).getStatusCode().value());
        verify(reminders, never()).save(any());
    }

    @Test void cannotStealAnExpenseLinkedToAnotherReminder() {
        var other = new MaintenanceReminder(); other.setId(11);
        when(reminders.findByCompletedExpenseId(20)).thenReturn(Optional.of(other));
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.complete(1, 10, 20, "owner@example.com")).getStatusCode().value());
        verify(reminders, never()).save(any());
    }

    @Test void cannotReplaceAnExistingCompletionWithoutUnlinkingIt() {
        var previous = new Expense(); previous.setId(21); reminder.setCompletedExpense(previous);
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.complete(1, 10, 20, "owner@example.com")).getStatusCode().value());
        assertSame(previous, reminder.getCompletedExpense());
    }

    @Test void repeatLinkIsIdempotentAndDoesNotCreateExpenses() {
        reminder.setCompletedExpense(expense);
        when(reminders.findByCompletedExpenseId(20)).thenReturn(Optional.of(reminder));
        assertEquals(20, service.complete(1, 10, 20, "owner@example.com").expenseId());
        assertEquals(20, service.complete(1, 10, 20, "owner@example.com").expenseId());
        verify(expenses, never()).save(any());
    }

    @Test void unlinkReopensReminderAndPreservesHistoricalExpense() {
        reminder.setCompletedExpense(expense);
        var dto = service.complete(1, 10, null, "owner@example.com");
        assertEquals("PENDING", dto.status()); assertNull(dto.expenseId()); assertEquals(101000, dto.targetOdometer());
        assertEquals(new BigDecimal("85.50"), expense.getCost()); verifyNoInteractions(expenses);
    }

    @Test void deletionOnlyDeletesTheReminder() {
        reminder.setCompletedExpense(expense);
        service.delete(1, 10, "owner@example.com");
        verify(reminders).delete(reminder); verifyNoInteractions(expenses);
    }

    @Test void changingExpenseLinkReopensOldReminderBeforeCompletingNewOne() {
        var previous = new MaintenanceReminder(); previous.setId(11); previous.setCompletedExpense(expense);
        when(reminders.findByCompletedExpenseId(20)).thenReturn(Optional.of(previous));
        service.syncExpenseLink(expense, 10);
        assertNull(previous.getCompletedExpense()); assertSame(expense, reminder.getCompletedExpense());
        var order = inOrder(reminders); order.verify(reminders).saveAndFlush(previous); order.verify(reminders).save(reminder);
    }

    @Test void clearingExpenseLinkReopensOnlyItsReminder() {
        reminder.setCompletedExpense(expense); when(reminders.findByCompletedExpenseId(20)).thenReturn(Optional.of(reminder));
        service.syncExpenseLink(expense, null);
        assertNull(reminder.getCompletedExpense()); assertEquals(101000, reminder.getTargetOdometer());
        verify(reminders).saveAndFlush(reminder);
    }

    @Test void completedReminderMustBeUnlinkedBeforeEditingSchedule() {
        reminder.setCompletedExpense(expense);
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> service.save(1, 10,
                new MaintenanceReminderDTO("Cambio", null, 110000, null), "owner@example.com")).getStatusCode().value());
    }

    @Test void deadlinesUseCurrentOdometerAndKeepIndependentRecords() {
        when(fuelings.findMaxOdometerByVehicleId(1)).thenReturn(100500);
        var later = new MaintenanceReminder(); later.setId(11); later.setVehicle(vehicle); later.setTitle("Frenos"); later.setTargetDate(LocalDate.now().plusDays(60));
        when(reminders.findByVehicleIdOrderByIdDesc(1)).thenReturn(List.of(reminder, later));
        var result = service.list(1, "owner@example.com");
        assertEquals(500, result.get(0).remainingKm()); assertEquals("CRITICAL", result.get(0).urgency()); assertEquals("OK", result.get(1).urgency());
    }

    @Test void validatesRequiredTitleAndAtLeastOnePositiveDeadline() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            assertFalse(validator.validate(new MaintenanceReminderDTO(" ", null, null, null)).isEmpty());
            assertFalse(validator.validate(new MaintenanceReminderDTO("Aceite", null, 0, null)).isEmpty());
            assertTrue(validator.validate(new MaintenanceReminderDTO("Aceite", null, null, LocalDate.now())).isEmpty());
        }
    }

    @Test void omittedAndExplicitlyClearedExpenseLinksAreDifferent() throws Exception {
        var mapper = tools.jackson.databind.json.JsonMapper.builder().build();
        assertFalse(mapper.readValue("{}", ExpenseDTO.class).isMaintenanceReminderSpecified());
        var cleared = mapper.readValue("{\"maintenanceReminderId\":null}", ExpenseDTO.class);
        assertTrue(cleared.isMaintenanceReminderSpecified()); assertNull(cleared.getMaintenanceReminderId());
    }
}
