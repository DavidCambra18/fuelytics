package com.fuelytics.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "google_accounts")
public class GoogleAccount {
    @Id
    @Column(name = "user_id")
    private Integer userId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "google_subject", nullable = false, unique = true, length = 255)
    private String googleSubject;

    protected GoogleAccount() { }

    public GoogleAccount(User user, String googleSubject) {
        this.user = user;
        this.googleSubject = googleSubject;
    }

    public User getUser() { return user; }
    public String getGoogleSubject() { return googleSubject; }
}
