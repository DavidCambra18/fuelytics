package com.fuelytics.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;
import com.fuelytics.backend.entity.*;
import com.fuelytics.backend.entity.enums.*;
import com.fuelytics.backend.repository.*;

class ExportUnicodeTest {
    @Test
    void exportsUnicodeNamesAndReplacesUnsupportedGlyphsWithoutFailing() throws Exception {
        var vehicles = mock(VehicleRepository.class);
        var users = mock(UserRepository.class);
        var expenses = mock(ExpenseRepository.class);
        User owner = new User();
        owner.setId(1);
        Vehicle vehicle = new Vehicle();
        vehicle.setId(2);
        vehicle.setUser(owner);
        vehicle.setBrand("Škoda");
        vehicle.setModel("Αθήνα 🚗");
        vehicle.setVehicleEnergyType(VehicleEnergyType.gasoline);
        vehicle.setVehicleType(VehicleType.car);
        Expense expense = new Expense();
        expense.setDate(LocalDate.of(2026, 10, 21));
        expense.setCost(BigDecimal.TEN);
        expense.setDescription("Revisión Ж 🚗 漢字");
        when(users.findByEmail("owner@example.com")).thenReturn(owner);
        when(vehicles.findById(2)).thenReturn(Optional.of(vehicle));
        when(expenses.findByVehicleIdOrderByDateDesc(2)).thenReturn(List.of(expense));
        var service = new ExportService(vehicles, users, mock(FuelingRepository.class), expenses, new ConsumptionCalculator());
        byte[] body = service.exportExpenses(2, null, null, "owner@example.com").getBody();
        assertNotNull(body);
        try (var document = Loader.loadPDF(body)) {
            String text = new PDFTextStripper().getText(document);
            assertTrue(text.contains("Škoda"));
            assertTrue(text.contains("Αθήνα"));
            assertTrue(text.contains("Revisión Ж"));
            assertTrue(text.contains("?"));
        }
    }
}
