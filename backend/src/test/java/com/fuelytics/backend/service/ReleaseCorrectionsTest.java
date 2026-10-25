package com.fuelytics.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.context.ApplicationEventPublisher;
import com.fuelytics.backend.dto.*;
import com.fuelytics.backend.entity.*;
import com.fuelytics.backend.entity.enums.*;
import com.fuelytics.backend.repository.*;
import com.fuelytics.backend.security.JwtService;

class ReleaseCorrectionsTest {
    @Test void filteredPdfKeepsBaselineButPeriodCostsExcludePreviousMonth() throws Exception {
        var users = mock(UserRepository.class); var vehicles = mock(VehicleRepository.class);
        var fuelings = mock(FuelingRepository.class); var expenses = mock(ExpenseRepository.class);
        var owner = new User(); owner.setId(1); owner.setEmail("owner@example.com");
        var vehicle = new Vehicle(); vehicle.setId(1); vehicle.setUser(owner); vehicle.setBrand("Marca"); vehicle.setModel("Modelo");
        vehicle.setVehicleType(VehicleType.car); vehicle.setVehicleEnergyType(VehicleEnergyType.diesel);
        when(users.findByEmail(owner.getEmail())).thenReturn(owner);
        when(vehicles.findById(1)).thenReturn(Optional.of(vehicle));
        when(fuelings.findByVehicleIdOrderByDateDesc(1)).thenReturn(List.of(
                entry(1, "2026-01-01", RefuelingType.initial, "0", "40", "60"),
                entry(2, "2026-01-20", RefuelingType.partial, "200", "20", "30"),
                entry(3, "2026-02-01", RefuelingType.complete, "300", "25", "40")));
        var service = new ExportService(vehicles, users, fuelings, expenses, new ConsumptionCalculator());
        byte[] bytes = service.exportSummary(1, LocalDate.of(2026,2,1), LocalDate.of(2026,2,28), owner.getEmail()).getBody();
        try (var pdf = Loader.loadPDF(bytes)) {
            String text = new PDFTextStripper().getText(pdf);
            assertTrue(text.matches("(?s).*Consumo medio[^\\r\\n]* 9(?:[\\r\\n]|$).*"), text);
            assertTrue(text.contains("Coste combustible 40"), text);
            assertFalse(text.contains("Coste combustible 130"), text);
        }
    }
    @Test void vehicleEditLocksUserThenVehicleAndRejectsEnergyChangeAfterFirstFill() {
        var users = mock(UserRepository.class); var vehicles = mock(VehicleRepository.class); var fuelings = mock(FuelingRepository.class);
        var owner = new User(); owner.setId(1);
        var vehicle = new Vehicle(); vehicle.setId(2); vehicle.setUser(owner); vehicle.setVehicleEnergyType(VehicleEnergyType.diesel);
        when(users.findByEmailForUpdate("owner@example.com")).thenReturn(owner);
        when(vehicles.findByIdForUpdate(2)).thenReturn(Optional.of(vehicle));
        when(fuelings.existsByVehicleId(2)).thenReturn(true);
        var service = new VehicleService(vehicles, users, fuelings, mock(ExpenseRepository.class), new ConsumptionCalculator());
        var dto = new VehicleUpdateDTO(); dto.setVehicleEnergyType(VehicleEnergyType.electric);
        assertThrows(ResponseStatusException.class, () -> service.updateVehicle(2, dto, "owner@example.com"));
        var order = inOrder(users, vehicles, fuelings);
        order.verify(users).findByEmailForUpdate("owner@example.com"); order.verify(vehicles).findByIdForUpdate(2);
        order.verify(fuelings).existsByVehicleId(2); verify(vehicles, never()).save(any());
    }
    @Test void profileAndPrivacyShareTheSameUserLock() {
        var users = mock(UserRepository.class); var vehicles = mock(VehicleRepository.class);
        var owner = new User(); owner.setId(1); owner.setEmail("owner@example.com"); owner.setUsername("original"); owner.setProfilePublic(false);
        when(users.findByEmailForUpdate(owner.getEmail())).thenReturn(owner);
        var service = new UserService(users, vehicles, mock(BCryptPasswordEncoder.class), mock(JwtService.class), mock(ApplicationEventPublisher.class));
        var profile = new UserProfileDTO(); profile.setUsername("original"); profile.setFirstName("Nuevo");
        service.updateProfile(owner.getEmail(), profile);
        assertFalse(owner.getProfilePublic());
        var privacy = new UserPrivacyDTO(); privacy.setProfilePublic(true); service.updatePrivacy(owner.getEmail(), privacy);
        assertEquals("Nuevo", owner.getFirstName()); verify(users, times(2)).findByEmailForUpdate(owner.getEmail());
        verify(users, never()).findByEmail(anyString());
    }
    static FuelEntry entry(int id, String date, RefuelingType type, String distance, String quantity, String price) {
        var entry = new FuelEntry(); entry.setId(id); entry.setDate(LocalDate.parse(date)); entry.setRefueling(type);
        entry.setFuelType(FuelType.diesel); entry.setDistance(new BigDecimal(distance)); entry.setLiters(new BigDecimal(quantity)); entry.setPriceTotal(new BigDecimal(price));
        return entry;
    }
}
