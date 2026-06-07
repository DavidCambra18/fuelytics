package com.fuelytics.backend.service;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.fuelytics.backend.dto.ExpensePublicDTO;
import com.fuelytics.backend.dto.FuelEntryPublicDTO;
import com.fuelytics.backend.dto.VehicleDTO;
import com.fuelytics.backend.dto.VehicleResponseDTO;
import com.fuelytics.backend.dto.VehicleUpdateDTO;
import com.fuelytics.backend.entity.User;
import com.fuelytics.backend.entity.Vehicle;
import com.fuelytics.backend.repository.UserRepository;
import com.fuelytics.backend.repository.VehicleRepository;
import com.fuelytics.backend.repository.FuelingRepository;
import com.fuelytics.backend.repository.ExpenseRepository;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final FuelingRepository fuelingRepository;
    private final ExpenseRepository expenseRepository;

    public VehicleService(VehicleRepository vehicleRepository,
            UserRepository userRepository,
            FuelingRepository fuelingRepository,
            ExpenseRepository expenseRepository) {
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.fuelingRepository = fuelingRepository;
        this.expenseRepository = expenseRepository;
    }

    public VehicleResponseDTO createVehicle(VehicleDTO dto, String email) {

        User user = userRepository.findByEmail(email);

        Vehicle v = new Vehicle();

        v.setUser(user);
        v.setVehicleType(dto.getVehicleType());
        v.setVehicleEnergyType(dto.getVehicleEnergyType());
        v.setBrand(dto.getBrand());
        v.setModel(dto.getModel());
        v.setPower(dto.getPower());
        v.setCc(dto.getCc());
        v.setYear(dto.getYear());
        v.setOdometer(dto.getOdometer());
        v.setTankCapacity(dto.getTankCapacity());
        v.setOfficialConsumption(dto.getOfficialConsumption());
        v.setGearbox(dto.getGearbox());

        v.setIsPublic(false);
        v.setShowFuelData(true);
        v.setShowExpenses(false);
        v.setShowStatistics(true);

        Vehicle saved = vehicleRepository.save(v);

        return mapToDTO(saved);
    }

    public List<VehicleResponseDTO> getVehicles(String email) {

        User user = userRepository.findByEmail(email);

        return vehicleRepository.findByUserId(user.getId())
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    private VehicleResponseDTO mapToDTO(Vehicle v) {

        VehicleResponseDTO dto = new VehicleResponseDTO();

        dto.setId(v.getId());
        dto.setVehicleType(v.getVehicleType());
        dto.setVehicleEnergyType(v.getVehicleEnergyType());
        dto.setBrand(v.getBrand());
        dto.setModel(v.getModel());
        dto.setPower(v.getPower());
        dto.setCc(v.getCc());
        dto.setYear(v.getYear());
        dto.setOdometer(v.getOdometer());
        dto.setTankCapacity(v.getTankCapacity());
        dto.setGearbox(v.getGearbox());
        dto.setOfficialConsumption(v.getOfficialConsumption());
        dto.setIsPublic(v.getIsPublic());
        dto.setShowFuelData(v.getShowFuelData());
        dto.setShowExpenses(v.getShowExpenses());
        dto.setShowStatistics(v.getShowStatistics());

        return dto;
    }

    public VehicleResponseDTO getVehicleById(Integer id, String email) {

        User user = userRepository.findByEmail(email);

        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Vehiculo no encontrado"));

        if (!v.getIsPublic() && !v.getUser().getId().equals(user.getId())) {

            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Este vehiculo es privado");
        }

        return mapToDTO(v);
    }

    public VehicleResponseDTO updateVehicle(
            Integer id,
            VehicleUpdateDTO dto,
            String email) {

        User user = userRepository.findByEmail(email);

        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Vehicle not found"));

        if (!vehicle.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Forbidden");
        }

        if (dto.getBrand() != null) {
            vehicle.setBrand(dto.getBrand());
        }

        if (dto.getVehicleType() != null) {
            vehicle.setVehicleType(dto.getVehicleType());
        }

        if (dto.getVehicleEnergyType() != null) {
            vehicle.setVehicleEnergyType(dto.getVehicleEnergyType());
        }

        if (dto.getModel() != null) {
            vehicle.setModel(dto.getModel());
        }

        if (dto.getPower() != null) {
            vehicle.setPower(dto.getPower());
        }

        if (dto.getCc() != null) {
            vehicle.setCc(dto.getCc());
        }

        if (dto.getYear() != null) {
            vehicle.setYear(dto.getYear());
        }

        if (dto.getOdometer() != null) {
            vehicle.setOdometer(dto.getOdometer());
        }

        if (dto.getTankCapacity() != null) {
            vehicle.setTankCapacity(dto.getTankCapacity());
        }

        if (dto.getGearbox() != null) {
            vehicle.setGearbox(dto.getGearbox());
        }

        if (dto.getOfficialConsumption() != null) {
            vehicle.setOfficialConsumption(dto.getOfficialConsumption());
        }

        if (dto.getIsPublic() != null) {
            vehicle.setIsPublic(dto.getIsPublic());

            if (!dto.getIsPublic()) {
                vehicle.setShowFuelData(false);
                vehicle.setShowExpenses(false);
                vehicle.setShowStatistics(false);
            }
        }

        if (Boolean.TRUE.equals(vehicle.getIsPublic())) {
            if (dto.getShowFuelData() != null) {
                vehicle.setShowFuelData(dto.getShowFuelData());
            }

            if (dto.getShowExpenses() != null) {
                vehicle.setShowExpenses(dto.getShowExpenses());
            }

            if (dto.getShowStatistics() != null) {
                vehicle.setShowStatistics(dto.getShowStatistics());
            }
        }

        Vehicle savedVehicle = vehicleRepository.save(vehicle);

        return mapToDTO(savedVehicle);
    }

    public void deleteVehicle(Integer id, String email) {

        User user = userRepository.findByEmail(email);

        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Vehicle not found"));

        if (!vehicle.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Forbidden");
        }

        vehicleRepository.delete(vehicle);
    }

    public List<FuelEntryPublicDTO> getVehicleFuelings(Integer vehicleId, String email) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehículo no encontrado"));

        boolean isOwner = email != null && vehicle.getUser().getEmail().equals(email);

        if (!isOwner && (!Boolean.TRUE.equals(vehicle.getIsPublic()) || !Boolean.TRUE.equals(vehicle.getShowFuelData()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Los repostajes de este vehículo son privados");
        }

        return fuelingRepository.findByVehicleIdOrderByDateDesc(vehicleId).stream().map(fuel -> {
            FuelEntryPublicDTO dto = new FuelEntryPublicDTO();
            dto.setId(fuel.getId());
            dto.setDate(fuel.getDate());
            dto.setLiters(fuel.getLiters());
            dto.setPriceTotal(fuel.getPriceTotal());
            dto.setDistance(fuel.getDistance());
            dto.setBoardConsumption(fuel.getBoardConsumption());
            return dto;
        }).toList();
    }

    public List<ExpensePublicDTO> getVehicleExpenses(Integer vehicleId, String email) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehículo no encontrado"));

        boolean isOwner = email != null && vehicle.getUser().getEmail().equals(email);

        if (!isOwner && (!Boolean.TRUE.equals(vehicle.getIsPublic()) || !Boolean.TRUE.equals(vehicle.getShowExpenses()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Los gastos de este vehículo son privados");
        }

        return expenseRepository.findByVehicleIdOrderByDateDesc(vehicleId).stream().map(expense -> {
            ExpensePublicDTO dto = new ExpensePublicDTO();
            dto.setId(expense.getId());
            dto.setDate(expense.getDate());
            dto.setType(expense.getType() != null ? expense.getType().name() : null);
            dto.setCost(expense.getCost());
            return dto;
        }).toList();
    }

    public Map<String, Object> getVehicleStatistics(Integer vehicleId, String email) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehículo no encontrado"));

        boolean isOwner = email != null && vehicle.getUser().getEmail().equals(email);

        if (!isOwner && (!Boolean.TRUE.equals(vehicle.getIsPublic()) || !Boolean.TRUE.equals(vehicle.getShowStatistics()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Las estadísticas de este vehículo son privadas");
        }

        return Map.of(
            "message", "Estadísticas en construcción",
            "vehicleId", vehicleId
        );
    }
}