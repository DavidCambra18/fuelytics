package com.fuelytics.backend.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.fuelytics.backend.security.JwtAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    @Value("${app.cors.allowed-origin}")
    private String frontendUrl;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth

                    .requestMatchers("/api/users/register", "/api/users/login", "/api/users/public/**", "/api/health").permitAll()

                    .requestMatchers("/api/users/check-username", "/api/users/check-email").permitAll()

                    .requestMatchers("/api/external/**").permitAll()

                    .requestMatchers(HttpMethod.GET, "/api/vehicles/{id}/**").permitAll()

                    .requestMatchers("/api/users/**").authenticated()

                        .requestMatchers("/api/vehicles/**").authenticated()

                        .anyRequest().authenticated())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration healthConfig = new CorsConfiguration();
        healthConfig.setAllowedOriginPatterns(List.of("*"));
        healthConfig.setAllowedMethods(List.of("GET", "OPTIONS"));
        healthConfig.setAllowedHeaders(List.of("*"));
        healthConfig.setAllowCredentials(false);

        CorsConfiguration appConfig = new CorsConfiguration();

        appConfig.setAllowedOrigins(List.of(frontendUrl));

        appConfig.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "OPTIONS"));

        appConfig.setAllowedHeaders(List.of("*"));

        appConfig.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/api/health", healthConfig);
        source.registerCorsConfiguration("/**", appConfig);

        return source;
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}