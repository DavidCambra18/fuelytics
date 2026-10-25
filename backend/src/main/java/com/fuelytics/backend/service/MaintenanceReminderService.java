package com.fuelytics.backend.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.fuelytics.backend.dto.*;
import com.fuelytics.backend.entity.*;
import com.fuelytics.backend.entity.enums.ExpenseType;
import com.fuelytics.backend.repository.*;

@Service
public class MaintenanceReminderService {
    private final MaintenanceReminderRepository reminders;
    private final VehicleRepository vehicles;
    private final ExpenseRepository expenses;
    private final FuelingRepository fuelings;

    public MaintenanceReminderService(MaintenanceReminderRepository reminders, VehicleRepository vehicles,
            ExpenseRepository expenses, FuelingRepository fuelings) {
        this.reminders = reminders;
        this.vehicles = vehicles;
        this.expenses = expenses;
        this.fuelings = fuelings;
    }

    private Vehicle ownedVehicle(Integer id, String email, boolean lock) {
        Vehicle vehicle = (lock ? vehicles.findByIdForUpdate(id) : vehicles.findById(id))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehículo no encontrado"));
        if (email == null || !vehicle.getUser().getEmail().equals(email))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Los recordatorios son privados");
        return vehicle;
    }

    private MaintenanceReminder reminder(Integer vehicleId, Integer id) {
        MaintenanceReminder reminder = reminders.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recordatorio no encontrado"));
        if (!reminder.getVehicle().getId().equals(vehicleId))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El recordatorio no pertenece al vehículo");
        return reminder;
    }

    @Transactional(readOnly = true)
    public List<MaintenanceReminderResponseDTO> list(Integer vehicleId, String email) {
        Vehicle vehicle = ownedVehicle(vehicleId, email, false);
        int odometer = currentOdometer(vehicle);
        return reminders.findByVehicleIdOrderByIdDesc(vehicleId).stream().map(r -> response(r, odometer)).toList();
    }

    @Transactional
    public MaintenanceReminderResponseDTO save(Integer vehicleId, Integer id, MaintenanceReminderDTO dto, String email) {
        Vehicle vehicle = ownedVehicle(vehicleId, email, true);
        MaintenanceReminder reminder = id == null ? new MaintenanceReminder() : reminder(vehicleId, id);
        if (reminder.getCompletedExpense() != null)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Desvincula el mantenimiento antes de editar el recordatorio");
        reminder.setVehicle(vehicle);
        reminder.setTitle(dto.title().trim());
        reminder.setNotes(dto.notes() == null || dto.notes().isBlank() ? null : dto.notes().trim());
        reminder.setTargetOdometer(dto.targetOdometer());
        reminder.setTargetDate(dto.targetDate());
        return response(reminders.save(reminder), currentOdometer(vehicle));
    }

    @Transactional
    public MaintenanceReminderResponseDTO complete(Integer vehicleId, Integer id, Integer expenseId, String email) {
        Vehicle vehicle = ownedVehicle(vehicleId, email, true);
        MaintenanceReminder reminder = reminder(vehicleId, id);
        if (expenseId == null) {
            reminder.setCompletedExpense(null);
        } else {
            Expense expense = expenses.findById(expenseId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gasto no encontrado"));
            verifyExpense(reminder, expense, null);
            reminder.setCompletedExpense(expense);
        }
        return response(reminders.save(reminder), currentOdometer(vehicle));
    }

    private void verifyExpense(MaintenanceReminder reminder, Expense expense, Integer releasedReminderId) {
        if (!expense.getVehicle().getId().equals(reminder.getVehicle().getId()) || expense.getType() != ExpenseType.maintenance)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un gasto de mantenimiento de este vehículo");
        if (reminder.getCompletedExpense() != null && !reminder.getCompletedExpense().getId().equals(expense.getId()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El recordatorio ya tiene un mantenimiento vinculado");
        reminders.findByCompletedExpenseId(expense.getId()).ifPresent(other -> {
            if (!other.getId().equals(reminder.getId()) && !other.getId().equals(releasedReminderId))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "El gasto ya está vinculado a otro recordatorio");
        });
    }

    // The expense transaction holds the same vehicle row lock as all reminder writes.
    public void syncExpenseLink(Expense expense, Integer reminderId) {
        MaintenanceReminder previous = reminders.findByCompletedExpenseId(expense.getId()).orElse(null);
        MaintenanceReminder selected = reminderId == null ? null : reminder(expense.getVehicle().getId(), reminderId);
        if (selected != null) verifyExpense(selected, expense, previous == null ? null : previous.getId());
        if (previous != null && (selected == null || !previous.getId().equals(selected.getId()))) {
            previous.setCompletedExpense(null);
            reminders.saveAndFlush(previous);
        }
        if (selected != null) {
            selected.setCompletedExpense(expense);
            reminders.save(selected);
        }
    }

    @Transactional
    public void delete(Integer vehicleId, Integer id, String email) {
        ownedVehicle(vehicleId, email, true);
        reminders.delete(reminder(vehicleId, id));
    }

    private int currentOdometer(Vehicle vehicle) {
        Integer history = fuelings.findMaxOdometerByVehicleId(vehicle.getId());
        return Math.max(vehicle.getOdometer() == null ? 0 : vehicle.getOdometer(), history == null ? 0 : history);
    }

    private MaintenanceReminderResponseDTO response(MaintenanceReminder r, int odometer) {
        Expense completed = r.getCompletedExpense();
        Integer km = r.getTargetOdometer() == null ? null : r.getTargetOdometer() - odometer;
        Long days = r.getTargetDate() == null ? null : ChronoUnit.DAYS.between(LocalDate.now(), r.getTargetDate());
        String urgency = (km != null && km <= 500) || (days != null && days <= 7) ? "CRITICAL"
                : (km != null && km <= 1200) || (days != null && days <= 30) ? "WARNING" : "OK";
        return new MaintenanceReminderResponseDTO(r.getId(), r.getVehicle().getId(), r.getTitle(), r.getNotes(),
                r.getTargetOdometer(), r.getTargetDate(), km, days, completed == null ? urgency : "OK",
                completed == null ? "PENDING" : "COMPLETED", completed == null ? null : completed.getId(),
                completed == null ? null : completed.getDate(), completed == null ? null : completed.getCost());
    }
}
