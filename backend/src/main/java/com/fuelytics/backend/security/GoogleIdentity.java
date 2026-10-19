package com.fuelytics.backend.security;

public record GoogleIdentity(String subject, String email, String firstName, String lastName) { }
