package com.fuelytics.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.fuelytics.backend.dto.VehicleDTO;
import com.fuelytics.backend.dto.VehicleResponseDTO;
import com.fuelytics.backend.dto.VehicleUpdateDTO;
import com.fuelytics.backend.entity.User;
import com.fuelytics.backend.entity.Vehicle;
import com.fuelytics.backend.repository.UserRepository;
import com.fuelytics.backend.repository.VehicleRepository;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public VehicleService(VehicleRepository vehicleRepository,
            UserRepository userRepository) {
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
    }

    public VehicleResponseDTO createVehicle(VehicleDTO dto, String email) {

        User user = userRepository.findByEmail(email);

        Vehicle v = new Vehicle();

        v.setUser(user);
        v.setVehicleType(dto.getVehicleType());
        v.setBrand(dto.getBrand());
        v.setModel(dto.getModel());
        v.setPower(dto.getPower());
        v.setCc(dto.getCc());
        v.setYear(dto.getYear());
        v.setOdometer(dto.getOdometer());

        v.setFuelType(dto.getFuelType());
        v.setTankCapacity(dto.getTankCapacity());
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
        dto.setBrand(v.getBrand());
        dto.setModel(v.getModel());
        dto.setPower(v.getPower());
        dto.setCc(v.getCc());
        dto.setYear(v.getYear());
        dto.setOdometer(v.getOdometer());
        dto.setFuelType(v.getFuelType());
        dto.setTankCapacity(v.getTankCapacity());
        dto.setGearbox(v.getGearbox());
        dto.setOfficialConsumption(v.getOfficialConsumption());
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
}