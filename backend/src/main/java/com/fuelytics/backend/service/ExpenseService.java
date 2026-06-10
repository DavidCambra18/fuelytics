package com.fuelytics.backend.service;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.fuelytics.backend.dto.ExpenseDTO;
import com.fuelytics.backend.dto.ExpenseResponseDTO;
import com.fuelytics.backend.entity.Expense;
import com.fuelytics.backend.entity.TireSet;
import com.fuelytics.backend.entity.User;
import com.fuelytics.backend.entity.Vehicle;
import com.fuelytics.backend.entity.enums.ExpenseType;
import com.fuelytics.backend.repository.ExpenseRepository;
import com.fuelytics.backend.repository.TireSetRepository;
import com.fuelytics.backend.repository.UserRepository;
import com.fuelytics.backend.repository.VehicleRepository;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final TireSetRepository tireSetRepository;
    private final BadgeService badgeService;

    public ExpenseService(ExpenseRepository expenseRepository,
            VehicleRepository vehicleRepository,
            UserRepository userRepository,
            TireSetRepository tireSetRepository,
            BadgeService badgeService) {
        this.expenseRepository = expenseRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.tireSetRepository = tireSetRepository;
        this.badgeService = badgeService;
    }

    public ExpenseResponseDTO createExpense(ExpenseDTO dto, String email) {
        User user = userRepository.findByEmail(email);

        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehículo no encontrado"));

        if (!vehicle.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso");
        }

        Expense expense = new Expense();
        expense.setVehicle(vehicle);
        expense.setDate(dto.getDate());
        expense.setType(dto.getType());
        expense.setDescription(dto.getDescription());
        expense.setCost(dto.getCost());
        expense.setNextMaintenanceKm(dto.getNextMaintenanceKm());
        expense.setNextMaintenanceDate(dto.getNextMaintenanceDate());

        if (dto.getType() == ExpenseType.tire_change && dto.getTireSetId() != null) {
            TireSet tireSet = tireSetRepository.findById(dto.getTireSetId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Neumático no encontrado"));
            expense.setTireSet(tireSet);
        }

        Expense saved = expenseRepository.save(expense);

        badgeService.checkExpenseBadges(user, vehicle);

        return mapToDTO(saved);
    }

    public List<ExpenseResponseDTO> getExpensesByVehicle(Integer vehicleId, String email) {
        User user = userRepository.findByEmail(email);

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehículo no encontrado"));

        if (!vehicle.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso");
        }

        return expenseRepository.findByVehicleIdOrderByDateDesc(vehicleId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    public ExpenseResponseDTO updateExpense(Integer id, ExpenseDTO dto, String email) {
        User user = userRepository.findByEmail(email);

        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gasto no encontrado"));

        if (!expense.getVehicle().getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso");
        }

        if (dto.getDate() != null)
            expense.setDate(dto.getDate());
        if (dto.getType() != null)
            expense.setType(dto.getType());
        if (dto.getDescription() != null)
            expense.setDescription(dto.getDescription());
        if (dto.getCost() != null)
            expense.setCost(dto.getCost());

        expense.setNextMaintenanceKm(dto.getNextMaintenanceKm());
        expense.setNextMaintenanceDate(dto.getNextMaintenanceDate());

        if (expense.getType() == ExpenseType.tire_change && dto.getTireSetId() != null) {
            TireSet tireSet = tireSetRepository.findById(dto.getTireSetId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Neumático no encontrado"));
            expense.setTireSet(tireSet);
        } else {
            expense.setTireSet(null);
        }

        Expense updated = expenseRepository.save(expense);

        badgeService.checkExpenseBadges(user, expense.getVehicle());

        return mapToDTO(updated);
    }

    public void deleteExpense(Integer id, String email) {
        User user = userRepository.findByEmail(email);

        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gasto no encontrado"));

        if (!expense.getVehicle().getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso");
        }

        expenseRepository.deleteById(id);
    }

    private ExpenseResponseDTO mapToDTO(Expense expense) {
        ExpenseResponseDTO dto = new ExpenseResponseDTO();
        dto.setId(expense.getId());
        dto.setVehicleId(expense.getVehicle().getId());
        dto.setDate(expense.getDate());
        dto.setType(expense.getType());
        dto.setDescription(expense.getDescription());
        dto.setCost(expense.getCost());
        dto.setNextMaintenanceKm(expense.getNextMaintenanceKm());
        dto.setNextMaintenanceDate(expense.getNextMaintenanceDate());
        
        if (expense.getTireSet() != null) {
            dto.setTireSetId(expense.getTireSet().getId());
        }
        return dto;
    }
}