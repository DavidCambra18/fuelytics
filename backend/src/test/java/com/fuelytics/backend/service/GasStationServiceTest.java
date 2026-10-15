package com.fuelytics.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class GasStationServiceTest {

    private GasStationService.GasStationRecord station;

    @BeforeEach
    void setUp() {
        station = GasStationService.parseStations(responseBody()).get(0);
    }

    @ParameterizedTest
    @CsvSource({
            "diesel, 1.501, Diésel",
            "dieselPremium, 1.612, Diésel premium",
            "gasoline95, 1.623, Gasolina 95",
            "gasoline98, 1.734, Gasolina 98",
            "glp, 0.945, GLP",
            "gnc, 1.056, GNC",
            "gnl, 1.167, GNL",
            "biodiesel, 1.278, Biodiésel",
            "bioethanol, 1.389, Bioetanol"
    })
    void readsEverySupportedPriceFromTheMinistryPayload(String fuelType, double expectedPrice, String expectedLabel) {
        var result = station.toDto(fuelType, 40.4168, -3.7038);

        assertEquals(expectedPrice, result.price(), 0.0001);
        assertEquals(expectedLabel, result.fuelLabel());
    }

    private String responseBody() {
        return """
                {
                  "ListaEESSPrecio": [
                    {
                      "IDEESS": "1",
                      "Rótulo": "FUELYTICS TEST",
                      "Dirección": "CALLE PRUEBA, 1",
                      "C.P.": "28001",
                      "Municipio": "MADRID",
                      "IDMunicipio": "28079",
                      "Provincia": "MADRID",
                      "IDProvincia": "28",
                      "Latitud": "40,4168",
                      "Longitud (WGS84)": "-3,7038",
                      "Horario": "L-D: 24H",
                      "Margen": "D",
                      "Precio Gasoleo A": "1,501",
                      "Precio Gasoleo Premium": "1,612",
                      "Precio Gasolina 95 E5": "1,623",
                      "Precio Gasolina 98 E5": "1,734",
                      "Precio Gases licuados del petróleo": "0,945",
                      "Precio Gas Natural Comprimido": "1,056",
                      "Precio Gas Natural Licuado": "1,167",
                      "Precio Biodiesel": "1,278",
                      "Precio Bioetanol": "1,389"
                    }
                  ]
                }
                """;
    }
}
