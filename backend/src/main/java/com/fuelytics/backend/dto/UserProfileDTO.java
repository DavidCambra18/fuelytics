package com.fuelytics.backend.dto;

import java.util.List;

public class UserProfileDTO {

    private String username;
    private String firstName;
    private String lastName;
    private Boolean profilePublic;
    private List<VehicleResponseDTO> vehicles;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public Boolean getProfilePublic() {
        return profilePublic;
    }

    public void setProfilePublic(Boolean profilePublic) {
        this.profilePublic = profilePublic;
    }

    public List<VehicleResponseDTO> getVehicles() {
        return vehicles;
    }

    public void setVehicles(List<VehicleResponseDTO> vehicles) {
        this.vehicles = vehicles;
    }
}