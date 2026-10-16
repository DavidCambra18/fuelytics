package com.fuelytics.backend.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import javax.net.ssl.SSLParameters;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.fuelytics.backend.dto.GasStationDTO;
import com.fuelytics.backend.dto.GasStationSearchResponseDTO;
import tools.jackson.core.JsonParser;
import tools.jackson.core.JsonToken;
import tools.jackson.databind.json.JsonMapper;

@Service
public class GasStationService {

    private static final Logger log = LoggerFactory.getLogger(GasStationService.class);
    private static final JsonMapper JSON_MAPPER = JsonMapper.builder().build();
    private static final int REFRESH_ATTEMPTS = 3;
    private static final Duration RETRY_DELAY = Duration.ofSeconds(2);
    private final HttpClient httpClient;
    private final String sourceUrl;
    private final double defaultRadiusKm;
    private final AtomicReference<CachedStations> cache = new AtomicReference<>(
            new CachedStations(List.of(), Instant.EPOCH, false, ""));

    public GasStationService(
            @Value("${app.gas-stations.source-url:https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/}") String sourceUrl,
            @Value("${app.gas-stations.radius-km:15}") double defaultRadiusKm) {
        this.sourceUrl = sourceUrl;
        this.defaultRadiusKm = defaultRadiusKm;
        SSLParameters sslParameters = new SSLParameters();
        sslParameters.setProtocols(new String[] { "TLSv1.2" });
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .version(HttpClient.Version.HTTP_1_1)
                .sslParameters(sslParameters)
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
        Exception lastError = null;

        for (int attempt = 1; attempt <= REFRESH_ATTEMPTS; attempt++) {
            try {
                List<GasStationRecord> stations = fetchStations();
                cache.set(new CachedStations(stations, Instant.now(), true, ""));
                log.info("Gas station cache refreshed with {} stations", stations.size());
                return;
            } catch (InterruptedException error) {
                Thread.currentThread().interrupt();
                keepPreviousCache("La actualización fue interrumpida");
                return;
            } catch (IOException | RuntimeException error) {
                lastError = error;
                log.warn("Gas station refresh attempt {}/{} failed: {}", attempt, REFRESH_ATTEMPTS,
                        error.getMessage());

                if (attempt < REFRESH_ATTEMPTS) {
                    try {
                        Thread.sleep(RETRY_DELAY.toMillis());
                    } catch (InterruptedException interrupted) {
                        Thread.currentThread().interrupt();
                        keepPreviousCache("La actualización fue interrumpida");
                        return;
                    }
                }
            }
        }

        keepPreviousCache(lastError == null ? "No se pudo actualizar la fuente de precios" : lastError.getMessage());
    }

    private List<GasStationRecord> fetchStations() throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(URI.create(sourceUrl))
                .timeout(Duration.ofSeconds(45))
                .GET()
                .header("Accept", "application/json")
                .header("User-Agent", "Fuelytics/1.0")
                .build();
        HttpResponse<InputStream> response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());

        try (InputStream payload = response.body()) {
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("La API pública respondió con estado " + response.statusCode());
            }

            List<GasStationRecord> stations = parseStations(payload);
            if (stations.isEmpty()) {
                throw new IllegalStateException("La API pública no devolvió estaciones válidas");
            }
            return stations;
        }
    }

    private void keepPreviousCache(String message) {
        CachedStations previous = cache.get();
        cache.set(new CachedStations(previous.stations(), previous.updatedAt(), false, message));
        log.warn("Unable to refresh gas station cache: {}", message);
    }

    static List<GasStationRecord> parseStations(String payload) {
        if (payload == null || payload.isBlank()) {
            throw new IllegalArgumentException("La API pública devolvió una respuesta vacía");
        }

        return parseStations(new ByteArrayInputStream(payload.getBytes(StandardCharsets.UTF_8)));
    }

    private static List<GasStationRecord> parseStations(InputStream payload) {
        try {
            List<GasStationRecord> stations = new ArrayList<>();
            boolean stationListFound = false;

            try (JsonParser parser = JSON_MAPPER.createParser(payload)) {
                while (parser.nextToken() != null) {
                    if (parser.currentToken() == JsonToken.PROPERTY_NAME
                            && "ListaEESSPrecio".equals(parser.currentName())) {
                        stationListFound = true;
                        if (parser.nextToken() != JsonToken.START_ARRAY) {
                            throw new IllegalArgumentException("La lista de estaciones no tiene un formato válido");
                        }

                        while (parser.nextToken() == JsonToken.START_OBJECT) {
                            Map<String, String> fields = new java.util.LinkedHashMap<>();
                            while (parser.nextToken() != JsonToken.END_OBJECT) {
                                String name = parser.currentName();
                                JsonToken valueToken = parser.nextToken();
                                fields.put(name, valueToken == JsonToken.VALUE_NULL ? null : parser.getValueAsString());
                                if (valueToken == JsonToken.START_OBJECT || valueToken == JsonToken.START_ARRAY) {
                                    parser.skipChildren();
                                }
                            }
                            GasStationRecord station = GasStationRecord.fromFields(fields);
                            if (station != null) {
                                stations.add(station);
                            }
                        }
                        break;
                    }
                }
            }

            if (!stationListFound) {
                throw new IllegalArgumentException("La respuesta no contiene la lista de estaciones");
            }
            return stations;
        } catch (Exception error) {
            if (error instanceof IllegalArgumentException illegalArgumentException) {
                throw illegalArgumentException;
            }
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

        if (normalized.equals("dieselpremium") || normalized.equals("diesel_premium")
                || normalized.equals("gasoleo premium")) {
            return "dieselPremium";
        }

        if (normalized.contains("98")) {
            return "gasoline98";
        }

        if (normalized.contains("95")) {
            return "gasoline95";
        }

        if (normalized.equals("glp") || normalized.equals("gases licuados del petroleo")) {
            return "glp";
        }

        if (normalized.equals("gnc") || normalized.equals("gas natural comprimido")) {
            return "gnc";
        }

        if (normalized.equals("gnl") || normalized.equals("gas natural licuado")) {
            return "gnl";
        }

        if (normalized.equals("biodiesel")) {
            return "biodiesel";
        }

        if (normalized.equals("bioetanol") || normalized.equals("bioethanol")) {
            return "bioethanol";
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

    static final class GasStationRecord {

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
        private final Double dieselPremiumPrice;
        private final Double gasoline95Price;
        private final Double gasoline98Price;
        private final Double glpPrice;
        private final Double gncPrice;
        private final Double gnlPrice;
        private final Double biodieselPrice;
        private final Double bioethanolPrice;

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
                Double dieselPremiumPrice,
                Double gasoline95Price,
                Double gasoline98Price,
                Double glpPrice,
                Double gncPrice,
                Double gnlPrice,
                Double biodieselPrice,
                Double bioethanolPrice) {
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
            this.dieselPremiumPrice = dieselPremiumPrice;
            this.gasoline95Price = gasoline95Price;
            this.gasoline98Price = gasoline98Price;
            this.glpPrice = glpPrice;
            this.gncPrice = gncPrice;
            this.gnlPrice = gnlPrice;
            this.biodieselPrice = biodieselPrice;
            this.bioethanolPrice = bioethanolPrice;
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
                    parsePrice(fields, "Precio Gasoleo Premium"),
                    parsePreferredPrice(fields, "Precio Gasolina 95 E5", "Precio Gasolina 95 E10",
                            "Precio Gasolina 95 E25"),
                    parsePreferredPrice(fields, "Precio Gasolina 98 E5", "Precio Gasolina 98 E10"),
                    parsePrice(fields, "Precio Gases licuados del petróleo"),
                    parsePrice(fields, "Precio Gas Natural Comprimido"),
                    parsePrice(fields, "Precio Gas Natural Licuado"),
                    parsePrice(fields, "Precio Biodiesel"),
                    parsePrice(fields, "Precio Bioetanol"));
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
                case "dieselPremium" -> dieselPremiumPrice;
                case "gasoline95" -> gasoline95Price;
                case "gasoline98" -> gasoline98Price;
                case "glp" -> glpPrice;
                case "gnc" -> gncPrice;
                case "gnl" -> gnlPrice;
                case "biodiesel" -> biodieselPrice;
                case "bioethanol" -> bioethanolPrice;
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
                case "dieselPremium" -> "Diésel premium";
                case "gasoline95" -> "Gasolina 95";
                case "gasoline98" -> "Gasolina 98";
                case "glp" -> "GLP";
                case "gnc" -> "GNC";
                case "gnl" -> "GNL";
                case "biodiesel" -> "Biodiésel";
                case "bioethanol" -> "Bioetanol";
                default -> "Diésel";
            };
        }
    }
}
