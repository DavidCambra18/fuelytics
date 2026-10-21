package com.fuelytics.backend.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fuelytics.backend.dto.TireSetDTO;
import com.fuelytics.backend.dto.TireSetResponseDTO;
import com.fuelytics.backend.entity.TireSet;
import com.fuelytics.backend.entity.Vehicle;
import com.fuelytics.backend.repository.FuelingRepository;
import com.fuelytics.backend.repository.TireSetRepository;
import com.fuelytics.backend.repository.VehicleRepository;

@Service
public class TireService {

    private final TireSetRepository tireSetRepository;
    private final VehicleRepository vehicleRepository;
    private final FuelingRepository fuelingRepository; 

    public TireService(TireSetRepository tireSetRepository, VehicleRepository vehicleRepository, FuelingRepository fuelingRepository) {
        this.tireSetRepository = tireSetRepository;
        this.vehicleRepository = vehicleRepository;
        this.fuelingRepository = fuelingRepository;
    }

    public List<TireSetResponseDTO> getVehicleTires(Integer vehicleId, String principalName) {
        Vehicle vehicle = verifyOwnership(vehicleId, principalName);
        int currentOdometer = getMaxOdometer(vehicleId, vehicle.getOdometer());

        return tireSetRepository.findByVehicleIdOrderByInstallationDateDesc(vehicleId).stream()
                .map(tire -> mapToResponseDTO(tire, currentOdometer))
                .toList();
    }

    @Transactional
    public TireSetResponseDTO createTireSet(Integer vehicleId, TireSetDTO dto, String principalName) {
        Vehicle vehicle = verifyOwnershipForUpdate(vehicleId, principalName);

        List<TireSet> previousTires = tireSetRepository.findByVehicleIdAndActiveTrue(vehicleId).stream()
                .filter(t -> t.getAxle() == dto.getAxle())
                .toList();
        previousTires.forEach(t -> validateRemovalOdometer(t, dto.getInstallationOdometer()));
        previousTires.forEach(t -> {
                    t.setActive(false);
                    t.setRemovalOdometer(dto.getInstallationOdometer());
                    tireSetRepository.save(t);
                });
        // Release the unique active-axle slot before the IDENTITY insert of its replacement.
        if (!previousTires.isEmpty()) tireSetRepository.flush();

        TireSet tireSet = new TireSet();
        tireSet.setVehicle(vehicle);
        tireSet.setBrand(dto.getBrand());
        tireSet.setModel(dto.getModel());
        tireSet.setSize(dto.getSize());
        tireSet.setAxle(dto.getAxle());
        tireSet.setInstallationDate(dto.getInstallationDate());
        tireSet.setInstallationOdometer(dto.getInstallationOdometer());
        tireSet.setActive(true);

        TireSet saved = tireSetRepository.save(tireSet);
        
        int currentOdometer = getMaxOdometer(vehicleId, vehicle.getOdometer());
        return mapToResponseDTO(saved, currentOdometer);
    }

    @Transactional
    public void deactivateTire(Integer tireId, Integer removalOdometer, String principalName) {
        TireSet tire = tireSetRepository.findById(tireId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Neumático no encontrado"));
        verifyOwnershipForUpdate(tire.getVehicle().getId(), principalName);

        validateRemovalOdometer(tire, removalOdometer);
        tire.setActive(false);
        tire.setRemovalOdometer(removalOdometer);
        tireSetRepository.save(tire);
    }

    private void validateRemovalOdometer(TireSet tire, Integer odometer) {
        if (odometer == null || odometer < 0 || odometer < tire.getInstallationOdometer()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El odómetro de baja no puede ser inferior al de montaje");
        }
    }

    private Vehicle verifyOwnership(Integer vehicleId, String principalName) {
        Vehicle v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehículo no encontrado"));
        
        String ownerEmail = v.getUser().getEmail();

        if (!ownerEmail.equals(principalName)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado");
        }
        return v;
    }

    private Vehicle verifyOwnershipForUpdate(Integer vehicleId, String principalName) {
        Vehicle vehicle = vehicleRepository.findByIdForUpdate(vehicleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehículo no encontrado"));
        if (!vehicle.getUser().getEmail().equals(principalName)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso denegado");
        }
        return vehicle;
    }

    private int getMaxOdometer(Integer vehicleId, Integer baseOdometer) {
        Integer historyOdometer = fuelingRepository.findMaxOdometerByVehicleId(vehicleId);
        return Math.max(baseOdometer != null ? baseOdometer : 0,
                historyOdometer != null ? historyOdometer : 0);
    }

    private TireSetResponseDTO mapToResponseDTO(TireSet tire, int currentOdometer) {
        TireSetResponseDTO dto = new TireSetResponseDTO();
        dto.setId(tire.getId());
        dto.setBrand(tire.getBrand());
        dto.setModel(tire.getModel());
        dto.setSize(tire.getSize());
        dto.setAxle(tire.getAxle());
        dto.setInstallationDate(tire.getInstallationDate());
        dto.setInstallationOdometer(tire.getInstallationOdometer());
        dto.setRemovalOdometer(tire.getRemovalOdometer());
        dto.setActive(tire.isActive());

        if (tire.isActive()) {
            dto.setCurrentKm(Math.max(0, currentOdometer - tire.getInstallationOdometer()));
        } else if (tire.getRemovalOdometer() != null) {
            dto.setCurrentKm(Math.max(0, tire.getRemovalOdometer() - tire.getInstallationOdometer()));
        } else {
            dto.setCurrentKm(0);
        }
        return dto;
    }
}
