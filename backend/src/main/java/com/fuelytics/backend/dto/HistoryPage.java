package com.fuelytics.backend.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;

public record HistoryPage<T>(List<T> content, int page, int size, long totalElements, int totalPages,
        LocalDate startDate, LocalDate endDate, Map<String, BigDecimal> summary) {}
