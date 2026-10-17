package com.fuelytics.backend.security;

import java.io.IOException;
import java.time.Clock;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final String LOGIN_PATH = "/api/users/login";
    private static final String REGISTER_PATH = "/api/users/register";
    private static final String DELETE_ACCOUNT_PATH = "/api/users/account";

    private final Map<String, RequestWindow> windows = new ConcurrentHashMap<>();
    private final AtomicLong requestCounter = new AtomicLong();
    private final int loginMaxAttempts;
    private final int registerMaxAttempts;
    private final long windowMillis;
    private final Clock clock;

    @Autowired
    public AuthRateLimitFilter(
            @Value("${app.auth-rate-limit.login-max-attempts:10}") int loginMaxAttempts,
            @Value("${app.auth-rate-limit.register-max-attempts:5}") int registerMaxAttempts,
            @Value("${app.auth-rate-limit.window-ms:60000}") long windowMillis) {
        this(loginMaxAttempts, registerMaxAttempts, windowMillis, Clock.systemUTC());
    }

    AuthRateLimitFilter(int loginMaxAttempts, int registerMaxAttempts, long windowMillis, Clock clock) {
        if (loginMaxAttempts < 1 || registerMaxAttempts < 1 || windowMillis < 1) {
            throw new IllegalArgumentException("Los límites de autenticación deben ser mayores que cero");
        }
        this.loginMaxAttempts = loginMaxAttempts;
        this.registerMaxAttempts = registerMaxAttempts;
        this.windowMillis = windowMillis;
        this.clock = clock;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if ("DELETE".equalsIgnoreCase(request.getMethod()) && DELETE_ACCOUNT_PATH.equals(request.getRequestURI())) {
            return false;
        }
        if (!"POST".equalsIgnoreCase(request.getMethod())) return true;
        String path = request.getRequestURI();
        return !LOGIN_PATH.equals(path) && !REGISTER_PATH.equals(path);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        int limit = REGISTER_PATH.equals(path) ? registerMaxAttempts : loginMaxAttempts;
        long now = clock.millis();
        String key = path + ':' + request.getRemoteAddr();

        RequestWindow current = windows.compute(key, (ignored, previous) -> {
            if (previous == null || now >= previous.startedAt() + windowMillis) {
                return new RequestWindow(now, 1);
            }
            return new RequestWindow(previous.startedAt(), previous.attempts() + 1);
        });

        if (requestCounter.incrementAndGet() % 256 == 0) {
            windows.entrySet().removeIf(entry -> now >= entry.getValue().startedAt() + windowMillis);
        }

        if (current.attempts() > limit) {
            long retryAfterSeconds = Math.max(1,
                    (long) Math.ceil((current.startedAt() + windowMillis - now) / 1000.0));
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
            response.getWriter().write("{\"message\":\"Demasiados intentos. Inténtalo de nuevo más tarde.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private record RequestWindow(long startedAt, int attempts) {
    }
}
