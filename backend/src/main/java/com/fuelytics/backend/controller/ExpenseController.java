package com.fuelytics.backend.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fuelytics.backend.dto.ExpenseDTO;
import com.fuelytics.backend.dto.ExpenseResponseDTO;
import com.fuelytics.backend.service.ExpenseService;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping
    public ExpenseResponseDTO create(@RequestBody ExpenseDTO dto) {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        return expenseService.createExpense(dto, email);
    }

    @GetMapping("/vehicle/{vehicleId}")
    public List<ExpenseResponseDTO> getByVehicle(
            @PathVariable Integer vehicleId,
            Principal principal) {

        return expenseService.getExpensesByVehicle(vehicleId, principal.getName());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpenseResponseDTO> update(
            @PathVariable Integer id,
            @RequestBody ExpenseDTO dto,
            Principal principal) {

        ExpenseResponseDTO response = expenseService.updateExpense(id, dto, principal.getName());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Integer id,
            Principal principal) {

        expenseService.deleteExpense(id, principal.getName());
        return ResponseEntity.noContent().build();
    }
}
