package com.fuelytics.backend.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.fuelytics.backend.dto.GasStationDTO;
import com.fuelytics.backend.dto.GasStationSearchResponseDTO;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Service
public class GasStationService {

    private static final Logger log = LoggerFactory.getLogger(GasStationService.class);
    private final HttpClient httpClient;
    private final JsonMapper jsonMapper;
    private final String sourceUrl;
    private final double defaultRadiusKm;
    private final AtomicReference<CachedStations> cache = new AtomicReference<>(
            new CachedStations(List.of(), Instant.EPOCH, false, ""));

    public GasStationService(
            @Value("${app.gas-stations.source-url:https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/}") String sourceUrl,
            @Value("${app.gas-stations.radius-km:15}") double defaultRadiusKm) {
        this.sourceUrl = sourceUrl;
        this.defaultRadiusKm = defaultRadiusKm;
        this.jsonMapper = JsonMapper.builder().build();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(java.time.Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    @Scheduled(initialDelayString = "${app.gas-stations.initial-delay-ms:1000}",
            fixedDelayString = "${app.gas-stations.refresh-ms:1800000}")
    public void scheduledRefresh() {
        refreshCache();
    }

    public GasStationSearchResponseDTO findStations(
            String municipio,
            String provincia,
            Double lat,
            Double lng,
            Double radiusKm,
            String fuelType) {

        CachedStations cached = cache.get();
        String normalizedFuel = normalizeFuelType(fuelType);
        double effectiveRadiusKm = radiusKm != null && radiusKm > 0 ? radiusKm : defaultRadiusKm;

        List<GasStationDTO> stations = cached.stations().stream()
                .map(station -> station.toDto(normalizedFuel, lat, lng))
                .filter(dto -> dto.price() != null)
                .filter(dto -> matchesArea(dto, municipio, provincia))
                .filter(dto -> matchesRadius(dto, effectiveRadiusKm))
                .sorted(Comparator
                        .comparing(GasStationDTO::price, Comparator.nullsLast(Double::compareTo))
                        .thenComparing(GasStationDTO::distanceKm, Comparator.nullsLast(Double::compareTo))
                        .thenComparing(GasStationDTO::name, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();

        return new GasStationSearchResponseDTO(
                normalizedFuel,
                buildAreaLabel(municipio, provincia, lat, lng),
                effectiveRadiusKm,
                cached.updatedAt(),
                cached.ready(),
                cached.lastError(),
                stations.size(),
                stations);
    }

    public void refreshCache() {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(sourceUrl))
                    .timeout(java.time.Duration.ofSeconds(30))
                    .GET()
                    .header("Accept", "application/json")
                    .header("User-Agent", "Fuelytics/1.0")
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("La API pública respondió con estado " + response.statusCode());
            }

            String payload = response.body();
            if (payload == null || payload.isBlank()) {
                throw new IllegalStateException("La API pública devolvió una respuesta vacía");
            }

            List<GasStationRecord> stations = parseStations(payload);
            if (stations.isEmpty()) {
                throw new IllegalStateException("La API pública no devolvió estaciones válidas");
            }
            cache.set(new CachedStations(stations, Instant.now(), true, ""));
            log.info("Gas station cache refreshed with {} stations", stations.size());
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            keepPreviousCache("La actualización fue interrumpida");
        } catch (IOException | RuntimeException error) {
            keepPreviousCache(error.getMessage());
        }
    }

    private void keepPreviousCache(String message) {
        CachedStations previous = cache.get();
        cache.set(new CachedStations(previous.stations(), previous.updatedAt(), false, message));
        log.warn("Unable to refresh gas station cache: {}", message);
    }

    private List<GasStationRecord> parseStations(String payload) {
        try {
            JsonNode root = jsonMapper.readTree(payload);
            JsonNode array = root.get("ListaEESSPrecio");
            if (array == null || !array.isArray()) {
                throw new IllegalArgumentException("La respuesta no contiene la lista de estaciones");
            }

            List<GasStationRecord> stations = new ArrayList<>();
            for (JsonNode node : array) {
                Map<String, String> fields = new java.util.LinkedHashMap<>();
                node.forEachEntry((name, value) -> fields.put(
                        name,
                        value.isNull() ? null : value.asString()));
                GasStationRecord station = GasStationRecord.fromFields(fields);
                if (station != null) {
                    stations.add(station);
                }
            }
            return stations;
        } catch (Exception error) {
            throw new IllegalArgumentException("No se pudo interpretar la respuesta de gasolineras", error);
        }
    }

    private boolean matchesArea(GasStationDTO station, String municipio, String provincia) {
        return matchesValue(station.municipality(), station.municipalityId(), municipio)
                && matchesValue(station.province(), station.provinceId(), provincia);
    }

    private boolean matchesRadius(GasStationDTO dto, double radiusKm) {
        if (dto.distanceKm() == null) {
            return true;
        }

        return dto.distanceKm() <= radiusKm;
    }

    private boolean matchesValue(String name, String id, String filter) {
        if (filter == null || filter.isBlank()) {
            return true;
        }

        String normalizedFilter = normalize(filter);
        return normalize(name).equals(normalizedFilter)
                || normalize(id).equals(normalizedFilter)
                || normalize(name).contains(normalizedFilter);
    }

    private String buildAreaLabel(String municipio, String provincia, Double lat, Double lng) {
        if (municipio != null && !municipio.isBlank() && provincia != null && !provincia.isBlank()) {
            return municipio + ", " + provincia;
        }

        if (municipio != null && !municipio.isBlank()) {
            return municipio;
        }

        if (provincia != null && !provincia.isBlank()) {
            return provincia;
        }

        if (lat != null && lng != null) {
            return String.format(Locale.ROOT, "%.4f, %.4f", lat, lng);
        }

        return "Centro del mapa";
    }

    private String normalizeFuelType(String fuelType) {
        String normalized = normalize(fuelType);

        if (normalized.contains("98")) {
            return "gasoline98";
        }

        if (normalized.contains("95")) {
            return "gasoline95";
        }

        return "diesel";
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }

        String withoutAccents = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");

        return withoutAccents.toLowerCase(Locale.ROOT).trim();
    }

    private record CachedStations(List<GasStationRecord> stations, Instant updatedAt, boolean ready, String lastError) {
    }

    private static final class GasStationRecord {

        private final String id;
        private final String brand;
        private final String name;
        private final String address;
        private final String postalCode;
        private final String municipality;
        private final String municipalityId;
        private final String province;
        private final String provinceId;
        private final Double latitude;
        private final Double longitude;
        private final String schedule;
        private final String margin;
        private final Double dieselPrice;
        private final Double gasoline95Price;
        private final Double gasoline98Price;

        private GasStationRecord(
                String id,
                String brand,
                String name,
                String address,
                String postalCode,
                String municipality,
                String municipalityId,
                String province,
                String provinceId,
                Double latitude,
                Double longitude,
                String schedule,
                String margin,
                Double dieselPrice,
                Double gasoline95Price,
                Double gasoline98Price) {
            this.id = id;
            this.brand = brand;
            this.name = name;
            this.address = address;
            this.postalCode = postalCode;
            this.municipality = municipality;
            this.municipalityId = municipalityId;
            this.province = province;
            this.provinceId = provinceId;
            this.latitude = latitude;
            this.longitude = longitude;
            this.schedule = schedule;
            this.margin = margin;
            this.dieselPrice = dieselPrice;
            this.gasoline95Price = gasoline95Price;
            this.gasoline98Price = gasoline98Price;
        }

        static GasStationRecord fromFields(Map<String, String> fields) {
            Double latitude = parseDouble(fields.get("Latitud"));
            Double longitude = parseDouble(fields.get("Longitud (WGS84)"));

            if (latitude == null || longitude == null) {
                return null;
            }

            return new GasStationRecord(
                    fields.getOrDefault("IDEESS", ""),
                    fields.getOrDefault("Rótulo", ""),
                    fields.getOrDefault("Rótulo", ""),
                    fields.getOrDefault("Dirección", ""),
                    fields.getOrDefault("C.P.", ""),
                    fields.getOrDefault("Municipio", ""),
                    fields.getOrDefault("IDMunicipio", ""),
                    fields.getOrDefault("Provincia", ""),
                    fields.getOrDefault("IDProvincia", ""),
                    latitude,
                    longitude,
                    fields.getOrDefault("Horario", ""),
                    fields.getOrDefault("Margen", ""),
                    parsePrice(fields, "Precio Gasoleo A"),
                    parsePreferredPrice(fields, "Precio Gasolina 95 E5", "Precio Gasolina 95 E10",
                            "Precio Gasolina 95 E25"),
                    parsePreferredPrice(fields, "Precio Gasolina 98 E5", "Precio Gasolina 98 E10"));
        }

        GasStationDTO toDto(String fuelType, Double userLat, Double userLng) {
            Double price = priceFor(fuelType);
            Double distance = distanceTo(userLat, userLng);

            return new GasStationDTO(
                    id,
                    brand,
                    name == null || name.isBlank() ? brand : name,
                    address,
                    postalCode,
                    municipality,
                    municipalityId,
                    province,
                    provinceId,
                    latitude,
                    longitude,
                    schedule,
                    margin,
                    fuelType,
                    labelFor(fuelType),
                    price,
                    distance);
        }

        Double priceFor(String fuelType) {
            return switch (fuelType) {
                case "gasoline95" -> gasoline95Price;
                case "gasoline98" -> gasoline98Price;
                default -> dieselPrice;
            };
        }

        Double distanceTo(Double userLat, Double userLng) {
            if (userLat == null || userLng == null) {
                return null;
            }

            double earthRadiusKm = 6371.0;
            double dLat = Math.toRadians(userLat - latitude);
            double dLng = Math.toRadians(userLng - longitude);
            double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                    + Math.cos(Math.toRadians(latitude)) * Math.cos(Math.toRadians(userLat))
                            * Math.sin(dLng / 2) * Math.sin(dLng / 2);
            double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return earthRadiusKm * c;
        }

        private static Double parsePrice(Map<String, String> fields, String key) {
            return parseDouble(fields.get(key));
        }

        private static Double parsePreferredPrice(Map<String, String> fields, String... keys) {
            for (String key : keys) {
                Double value = parsePrice(fields, key);
                if (value != null) {
                    return value;
                }
            }

            return null;
        }

        private static Double parseDouble(String value) {
            if (value == null || value.isBlank()) {
                return null;
            }

            try {
                return Double.parseDouble(value.replace(',', '.'));
            } catch (NumberFormatException error) {
                return null;
            }
        }

        private static String labelFor(String fuelType) {
            return switch (fuelType) {
                case "gasoline95" -> "Gasolina 95";
                case "gasoline98" -> "Gasolina 98";
                default -> "Diesel";
            };
        }
    }
}
