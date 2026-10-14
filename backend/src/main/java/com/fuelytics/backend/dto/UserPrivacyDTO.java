package com.fuelytics.backend.dto;

import jakarta.validation.constraints.NotNull;

public class UserPrivacyDTO {

    @NotNull(message = "La visibilidad del perfil es obligatoria")
    private Boolean profilePublic;

    public Boolean getProfilePublic() {
        return profilePublic;
    }

    public void setProfilePublic(Boolean profilePublic) {
        this.profilePublic = profilePublic;
    }
}
