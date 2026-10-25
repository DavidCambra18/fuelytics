package com.fuelytics.backend.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.fuelytics.backend.dto.*;
import com.fuelytics.backend.entity.*;
import com.fuelytics.backend.entity.enums.RefuelingType;
import com.fuelytics.backend.repository.*;

@Service
@Transactional(readOnly = true, isolation = org.springframework.transaction.annotation.Isolation.REPEATABLE_READ)
public class HistoryService {
    private final VehicleRepository vehicles;
    private final FuelingRepository fuelings;
    private final ExpenseRepository expenses;
    private final MaintenanceReminderRepository reminders;
    private final FuelingService fuelingService;
    private final ExpenseService expenseService;
    public HistoryService(VehicleRepository vehicles, FuelingRepository fuelings, ExpenseRepository expenses,
            MaintenanceReminderRepository reminders, FuelingService fuelingService, ExpenseService expenseService) {
        this.vehicles = vehicles; this.fuelings = fuelings; this.expenses = expenses;
        this.reminders = reminders; this.fuelingService = fuelingService; this.expenseService = expenseService;
    }
    private Vehicle owner(Integer id, String email) {
        Vehicle vehicle = vehicles.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehículo no encontrado"));
        if (email == null || !email.equals(vehicle.getUser().getEmail())) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso");
        return vehicle;
    }
    private PageRequest request(int page, int size) {
        if (page < 1 || size < 1 || size > 100 || (long) (page - 1) * size > Integer.MAX_VALUE) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La página debe ser positiva y el tamaño debe estar entre 1 y 100");
        return PageRequest.of(page - 1, size, Sort.by(Sort.Order.desc("date"), Sort.Order.desc("id")));
    }
    public HistoryPage<FuelingHistoryRow> fuelings(Integer id, String email, int page, int size) {
        Vehicle vehicle = owner(id, email);
        Page<FuelEntry> data = fuelings.findByVehicleId(id, request(page, size));
        if (data.getTotalPages() > 0 && page > data.getTotalPages()) data = fuelings.findByVehicleId(id, request(data.getTotalPages(), size));
        Map<Integer, FuelingHistory.Value> values = new HashMap<>();
        if (!data.isEmpty()) {
            FuelEntry oldest = data.getContent().get(data.getNumberOfElements() - 1), newest = data.getContent().get(0);
            var groups = data.stream().map(entry -> FuelingHistory.fuels(entry.getFuelType())).distinct().toList();
            for (var fuels : groups) {
                var previous = fuelings.previousBaseline(id, fuels, Set.of(RefuelingType.initial, RefuelingType.complete), oldest.getDate(), oldest.getId(), PageRequest.of(0, 1));
                FuelEntry start = previous.isEmpty() ? oldest : previous.get(0);
                values.putAll(FuelingHistory.values(fuelings.cycleContext(id, fuels, start.getDate(), start.getId(), newest.getDate(), newest.getId()), vehicle.getVehicleType()));
            }
        }
        var rows = data.stream().map(entry -> {
            var value = values.getOrDefault(entry.getId(), new FuelingHistory.Value("partial", null));
            return new FuelingHistoryRow(fuelingService.mapToDTO(entry), value.state(), value.consumption());
        }).toList();
        var range = fuelings.dateRange(id);
        return new HistoryPage<>(rows, data.getNumber() + 1, size, data.getTotalElements(), Math.max(1, data.getTotalPages()), range.startDate(), range.endDate(), Map.of());
    }
    public HistoryPage<ExpenseResponseDTO> expenses(Integer id, String email, int page, int size, int year) {
        owner(id, email);
        if (year < 1 || year > 9998) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Año no válido");
        Page<Expense> data = expenses.findByVehicleId(id, request(page, size));
        if (data.getTotalPages() > 0 && page > data.getTotalPages()) data = expenses.findByVehicleId(id, request(data.getTotalPages(), size));
        var ids = data.stream().map(Expense::getId).toList();
        var links = ids.isEmpty() ? Map.<Integer, Integer>of() : reminders.findByCompletedExpense_IdIn(ids).stream()
                .collect(Collectors.toMap(r -> r.getCompletedExpense().getId(), MaintenanceReminder::getId));
        var rows = data.stream().map(entry -> expenseService.mapToDTO(entry, links.get(entry.getId()))).toList();
        var totals = expenses.totals(id, LocalDate.of(year, 1, 1), LocalDate.of(year + 1, 1, 1));
        BigDecimal cost = totals.getTotalCost() == null ? BigDecimal.ZERO : totals.getTotalCost();
        long months = totals.getStartDate() == null ? 0 : ChronoUnit.MONTHS.between(totals.getStartDate().withDayOfMonth(1), totals.getEndDate().withDayOfMonth(1)) + 1;
        return new HistoryPage<>(rows, data.getNumber() + 1, size, data.getTotalElements(), Math.max(1, data.getTotalPages()), totals.getStartDate(), totals.getEndDate(),
                Map.of("totalCost", cost, "monthSpan", BigDecimal.valueOf(months), "yearlyCost", totals.getYearlyCost() == null ? BigDecimal.ZERO : totals.getYearlyCost()));
    }
}
