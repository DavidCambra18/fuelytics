package com.fuelytics.backend.service;

import java.math.RoundingMode;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fuelytics.backend.dto.FuelingDTO;
import com.fuelytics.backend.dto.FuelingResponseDTO;
import com.fuelytics.backend.entity.FuelEntry;
import com.fuelytics.backend.entity.User;
import com.fuelytics.backend.entity.Vehicle;
import com.fuelytics.backend.repository.FuelingRepository;
import com.fuelytics.backend.repository.UserRepository;
import com.fuelytics.backend.repository.VehicleRepository;

@Service
public class FuelingService {

    private final FuelingRepository fuelingRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final BadgeService badgeService;

    public FuelingService(
            FuelingRepository fuelingRepository,
            VehicleRepository vehicleRepository,
            UserRepository userRepository,
            BadgeService badgeService) {

        this.fuelingRepository = fuelingRepository;
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.badgeService = badgeService;
    }

    public FuelingResponseDTO createFueling(FuelingDTO dto, String email) {

        User user = userRepository.findByEmail(email);

        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Vehicle not found"));

        if (!vehicle.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Forbidden");
        }

        FuelEntry fuelEntry = new FuelEntry();

        fuelEntry.setVehicle(vehicle);
        fuelEntry.setDate(dto.getDate());
        fuelEntry.setOdometer(dto.getOdometer());
        fuelEntry.setRefueling(dto.getRefueling());
        fuelEntry.setFuelType(dto.getFuelType());
        fuelEntry.setDistance(dto.getDistance());
        fuelEntry.setLiters(dto.getLiters());
        fuelEntry.setPriceTotal(dto.getPriceTotal());

        if (dto.getPriceTotal() != null && dto.getLiters() != null && dto.getLiters().signum() != 0) {
            fuelEntry.setPricePerLiter(dto.getPriceTotal().divide(dto.getLiters(), 3, RoundingMode.HALF_UP));
        }

        fuelEntry.setDrivingType(dto.getDrivingType());
        fuelEntry.setTireType(dto.getTireType());

        fuelEntry.setHighway(dto.getHighway() != null ? dto.getHighway() : false);
        fuelEntry.setCity(dto.getCity() != null ? dto.getCity() : false);
        fuelEntry.setRoad(dto.getRoad() != null ? dto.getRoad() : false);
        fuelEntry.setAc(dto.getAc() != null ? dto.getAc() : false);
        fuelEntry.setTrailer(dto.getTrailer() != null ? dto.getTrailer() : false);
        fuelEntry.setHeating(dto.getHeating() != null ? dto.getHeating() : false);

        fuelEntry.setBoardConsumption(dto.getBoardConsumption());
        fuelEntry.setAverageSpeed(dto.getAverageSpeed());
        fuelEntry.setNotes(dto.getNotes());

        if (dto.getOdometer() != null) {
            if (vehicle.getOdometer() == null || dto.getOdometer() > vehicle.getOdometer()) {
                vehicle.setOdometer(dto.getOdometer());
                vehicleRepository.save(vehicle);
            }
        }

        FuelEntry saved = fuelingRepository.save(fuelEntry);

        updateVehicleAverages(vehicle);

        badgeService.checkFuelingBadges(user, vehicle);

        return mapToDTO(saved);
    }

    @Transactional
    public FuelingResponseDTO updateFueling(Integer fuelingId, FuelingDTO dto, String email) {

        User user = userRepository.findByEmail(email);
        FuelEntry fuelEntry = getOwnedFueling(fuelingId, user);

        if (dto.getVehicleId() != null && !fuelEntry.getVehicle().getId().equals(dto.getVehicleId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Fueling cannot be reassigned to another vehicle");
        }

        fuelEntry.setDate(dto.getDate());
        fuelEntry.setOdometer(dto.getOdometer());
        fuelEntry.setRefueling(dto.getRefueling());
        fuelEntry.setFuelType(dto.getFuelType());
        fuelEntry.setDistance(dto.getDistance());
        fuelEntry.setLiters(dto.getLiters());
        fuelEntry.setPriceTotal(dto.getPriceTotal());

        if (dto.getPriceTotal() != null && dto.getLiters() != null && dto.getLiters().signum() != 0) {
            fuelEntry.setPricePerLiter(dto.getPriceTotal().divide(dto.getLiters(), 3, RoundingMode.HALF_UP));
        }

        fuelEntry.setDrivingType(dto.getDrivingType());
        fuelEntry.setTireType(dto.getTireType());
        fuelEntry.setHighway(dto.getHighway() != null ? dto.getHighway() : false);
        fuelEntry.setCity(dto.getCity() != null ? dto.getCity() : false);
        fuelEntry.setRoad(dto.getRoad() != null ? dto.getRoad() : false);
        fuelEntry.setAc(dto.getAc() != null ? dto.getAc() : false);
        fuelEntry.setTrailer(dto.getTrailer() != null ? dto.getTrailer() : false);
        fuelEntry.setHeating(dto.getHeating() != null ? dto.getHeating() : false);
        fuelEntry.setBoardConsumption(dto.getBoardConsumption());
        fuelEntry.setAverageSpeed(dto.getAverageSpeed());
        fuelEntry.setNotes(dto.getNotes());

        if (dto.getOdometer() != null) {
            Vehicle vehicleToUpdate = fuelEntry.getVehicle();
            if (vehicleToUpdate.getOdometer() == null || dto.getOdometer() > vehicleToUpdate.getOdometer()) {
                vehicleToUpdate.setOdometer(dto.getOdometer());
                vehicleRepository.save(vehicleToUpdate);
            }
        }

        FuelEntry saved = fuelingRepository.save(fuelEntry);

        updateVehicleAverages(saved.getVehicle());

        badgeService.checkFuelingBadges(user, fuelEntry.getVehicle());

        return mapToDTO(saved);
    }

    @Transactional
    public void deleteFueling(Integer fuelingId, String email) {

        User user = userRepository.findByEmail(email);
        FuelEntry fuelEntry = getOwnedFueling(fuelingId, user);
        Vehicle vehicle = fuelEntry.getVehicle();

        fuelingRepository.delete(fuelEntry);
        fuelingRepository.flush();

        updateVehicleAverages(vehicle);
    }

    public List<FuelingResponseDTO> getVehicleFuelings(
            Integer vehicleId,
            String email) {

        User user = userRepository.findByEmail(email);

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Vehicle not found"));

        if (!vehicle.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Forbidden");
        }

        return fuelingRepository.findByVehicleIdOrderByDateDesc(vehicleId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    private FuelEntry getOwnedFueling(Integer fuelingId, User user) {

        FuelEntry fuelEntry = fuelingRepository.findById(fuelingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Fueling not found"));

        if (!fuelEntry.getVehicle().getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Forbidden");
        }

        return fuelEntry;
    }

    private void updateVehicleAverages(Vehicle vehicle) {
        List<FuelEntry> fuelings = fuelingRepository.findByVehicleIdOrderByDateDesc(vehicle.getId());

        int count = fuelings.size();
        vehicle.setFuelEntriesCount(count);

        if (count < 5) {
            vehicle.setAvgConsumption(null);
        } else {
            double totalLiters = fuelings.stream()
                    .filter(f -> f.getLiters() != null)
                    .mapToDouble(f -> f.getLiters().doubleValue())
                    .sum();

            double totalDistance = fuelings.stream()
                    .filter(f -> f.getDistance() != null)
                    .mapToDouble(f -> f.getDistance().doubleValue())
                    .sum();

            if (totalDistance > 0) {
                double avg = (totalLiters / totalDistance) * 100.0;
                vehicle.setAvgConsumption(Math.round(avg * 100.0) / 100.0);
            } else {
                vehicle.setAvgConsumption(null);
            }
        }

        vehicleRepository.save(vehicle);
    }

    private FuelingResponseDTO mapToDTO(FuelEntry fuelEntry) {

        FuelingResponseDTO dto = new FuelingResponseDTO();

        dto.setId(fuelEntry.getId());
        dto.setDate(fuelEntry.getDate());
        dto.setOdometer(fuelEntry.getOdometer());
        dto.setRefueling(fuelEntry.getRefueling());
        dto.setFuelType(fuelEntry.getFuelType());
        dto.setDistance(fuelEntry.getDistance());
        dto.setLiters(fuelEntry.getLiters());
        dto.setPriceTotal(fuelEntry.getPriceTotal());
        dto.setPricePerLiter(fuelEntry.getPricePerLiter());
        dto.setDrivingType(fuelEntry.getDrivingType());
        dto.setTireType(fuelEntry.getTireType());
        dto.setHighway(fuelEntry.getHighway());
        dto.setCity(fuelEntry.getCity());
        dto.setRoad(fuelEntry.getRoad());
        dto.setAc(fuelEntry.getAc());
        dto.setTrailer(fuelEntry.getTrailer());
        dto.setHeating(fuelEntry.getHeating());
        dto.setBoardConsumption(fuelEntry.getBoardConsumption());
        dto.setAverageSpeed(fuelEntry.getAverageSpeed());
        dto.setNotes(fuelEntry.getNotes());

        return dto;
    }
}