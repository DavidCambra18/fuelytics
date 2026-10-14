package com.fuelytics.backend.dto;

import java.util.List;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UserProfileDTO {

    @Size(min = 3, max = 15, message = "El nombre de usuario debe tener entre 3 y 15 caracteres")
    @Pattern(regexp = "^[A-Za-z0-9._-]+$", message = "El nombre de usuario contiene caracteres no permitidos")
    private String username;
    @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
    private String firstName;
    @Size(max = 100, message = "El apellido no puede superar 100 caracteres")
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
