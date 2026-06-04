package com.fuelytics.backend.service;

import java.io.ByteArrayOutputStream;
import java.awt.Color;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.fuelytics.backend.entity.Expense;
import com.fuelytics.backend.entity.FuelEntry;
import com.fuelytics.backend.entity.User;
import com.fuelytics.backend.entity.Vehicle;
import com.fuelytics.backend.repository.ExpenseRepository;
import com.fuelytics.backend.repository.FuelingRepository;
import com.fuelytics.backend.repository.UserRepository;
import com.fuelytics.backend.repository.VehicleRepository;

@Service
public class ExportService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FILE_DATE_FORMAT = DateTimeFormatter.BASIC_ISO_DATE;

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final FuelingRepository fuelingRepository;
    private final ExpenseRepository expenseRepository;

    public ExportService(
            VehicleRepository vehicleRepository,
            UserRepository userRepository,
            FuelingRepository fuelingRepository,
            ExpenseRepository expenseRepository) {
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
        this.fuelingRepository = fuelingRepository;
        this.expenseRepository = expenseRepository;
    }

    public ResponseEntity<byte[]> exportFuelings(
            Integer vehicleId,
            LocalDate startDate,
            LocalDate endDate,
            String email) {

        validateRange(startDate, endDate);

        Vehicle vehicle = getOwnedVehicle(vehicleId, email);
        List<FuelEntry> fuelings = filterFuelingsByDateRange(
                fuelingRepository.findByVehicleIdOrderByDateDesc(vehicleId),
                startDate,
                endDate);

        if (fuelings.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No hay repostajes en el rango seleccionado");
        }

        byte[] body = buildFuelingsPdf(vehicle, fuelings, startDate, endDate);
        return buildResponse(body, buildFileName("repostajes", vehicle, startDate, endDate));
    }

    public ResponseEntity<byte[]> exportExpenses(
            Integer vehicleId,
            LocalDate startDate,
            LocalDate endDate,
            String email) {

        validateRange(startDate, endDate);

        Vehicle vehicle = getOwnedVehicle(vehicleId, email);
        List<Expense> expenses = filterExpensesByDateRange(
                expenseRepository.findByVehicleIdOrderByDateDesc(vehicleId),
                startDate,
                endDate);

        if (expenses.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No hay gastos en el rango seleccionado");
        }

        byte[] body = buildExpensesPdf(vehicle, expenses, startDate, endDate);
        return buildResponse(body, buildFileName("gastos", vehicle, startDate, endDate));
    }

    public ResponseEntity<byte[]> exportSummary(
            Integer vehicleId,
            LocalDate startDate,
            LocalDate endDate,
            String email) {

        validateRange(startDate, endDate);

        Vehicle vehicle = getOwnedVehicle(vehicleId, email);
        List<FuelEntry> fuelings = filterFuelingsByDateRange(
                fuelingRepository.findByVehicleIdOrderByDateDesc(vehicleId),
                startDate,
                endDate);
        List<Expense> expenses = filterExpensesByDateRange(
                expenseRepository.findByVehicleIdOrderByDateDesc(vehicleId),
                startDate,
                endDate);

        if (fuelings.isEmpty() && expenses.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No hay datos en el rango seleccionado");
        }

        byte[] body = buildSummaryPdf(vehicle, fuelings, expenses, startDate, endDate);
        return buildResponse(body, buildFileName("resumen", vehicle, startDate, endDate));
    }

    private ResponseEntity<byte[]> buildResponse(byte[] body, String fileName) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"");
        headers.setContentLength(body.length);
        return new ResponseEntity<>(body, headers, HttpStatus.OK);
    }

    private String buildFileName(String reportType, Vehicle vehicle, LocalDate startDate, LocalDate endDate) {
        return "fuelytics_" + reportType + "_" + slug(vehicleTitle(vehicle)) + "_" + rangeFileLabel(startDate, endDate)
                + ".pdf";
    }

    private Vehicle getOwnedVehicle(Integer vehicleId, String email) {
        User user = userRepository.findByEmail(email);

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehículo no encontrado"));

        if (!vehicle.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para exportar este vehículo");
        }

        return vehicle;
    }

    private void validateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La fecha inicio no puede ser posterior a la fecha fin");
        }
    }

    private List<FuelEntry> filterFuelingsByDateRange(List<FuelEntry> fuelings, LocalDate startDate,
            LocalDate endDate) {
        return fuelings.stream()
                .filter(fueling -> isWithinRange(fueling.getDate(), startDate, endDate))
                .collect(Collectors.toList());
    }

    private List<Expense> filterExpensesByDateRange(List<Expense> expenses, LocalDate startDate, LocalDate endDate) {
        return expenses.stream()
                .filter(expense -> isWithinRange(expense.getDate(), startDate, endDate))
                .collect(Collectors.toList());
    }

    private boolean isWithinRange(LocalDate value, LocalDate startDate, LocalDate endDate) {
        if (value == null) {
            return false;
        }

        if (startDate != null && value.isBefore(startDate)) {
            return false;
        }

        if (endDate != null && value.isAfter(endDate)) {
            return false;
        }

        return true;
    }

    private byte[] buildFuelingsPdf(Vehicle vehicle, List<FuelEntry> fuelings, LocalDate startDate, LocalDate endDate) {
        SummaryTotals totals = calculateTotals(fuelings, List.of());

        List<PdfMetric> metrics = List.of(
                new PdfMetric("Repostajes", String.valueOf(totals.fuelingCount()), new Color(20, 184, 166)),
                new PdfMetric("Km", formatDecimal(totals.totalDistance(), 2), new Color(15, 118, 110)),
                new PdfMetric("Litros", formatDecimal(totals.totalLiters(), 2), new Color(8, 145, 178)),
                new PdfMetric("Coste", formatDecimal(totals.totalFuelCost(), 2), new Color(12, 74, 110)),
                new PdfMetric("€/L", formatDecimal(totals.averageFuelPrice(), 3), new Color(13, 148, 136)));

        PdfTable table = new PdfTable(
                "Historial de repostajes",
                new String[] { "Fecha", "Odómetro", "Tipo", "Combustible", "Litros", "Km", "Importe", "€/L" },
                new int[] { 12, 10, 10, 16, 10, 10, 10, 8 },
                fuelings.stream()
                        .map(fueling -> new String[] {
                                formatDate(fueling.getDate()),
                                stringOrDash(fueling.getOdometer()),
                                truncate(translateRefuelingType(fueling.getRefueling()), 12),
                                truncate(translateFuelType(fueling.getFuelType()), 16),
                                formatDecimal(fueling.getLiters(), 2),
                                formatDecimal(fueling.getDistance(), 2),
                                formatDecimal(fueling.getPriceTotal(), 2) + " €",
                                formatDecimal(fueling.getPricePerLiter(), 3)
                        })
                        .toList());

        return buildStyledPdf(
                "Informe de repostajes",
                vehicleTitle(vehicle),
                rangeLabel(startDate, endDate),
                true,
                metrics,
                table,
                "Totales: registros=" + fuelings.size() + " km=" + formatDecimal(totals.totalDistance(), 2) + " litros="
                        + formatDecimal(totals.totalLiters(), 2) + " coste="
                        + formatDecimal(totals.totalFuelCost(), 2));
    }

    private byte[] buildExpensesPdf(Vehicle vehicle, List<Expense> expenses, LocalDate startDate, LocalDate endDate) {
        SummaryTotals totals = calculateTotals(List.of(), expenses);

        List<PdfMetric> metrics = List.of(
                new PdfMetric("Gastos", String.valueOf(totals.expenseCount()), new Color(245, 158, 11)),
                new PdfMetric("Coste", formatDecimal(totals.totalExpenseCost(), 2), new Color(180, 83, 9)),
                new PdfMetric("Media", formatDecimal(totals.averageExpenseCost(), 2), new Color(217, 119, 6)));

        PdfTable table = new PdfTable(
                "Historial de gastos",
                new String[] { "Fecha", "Tipo", "Coste", "Descripción" },
                new int[] { 12, 18, 12, 50 },
                expenses.stream()
                        .map(expense -> new String[] {
                                formatDate(expense.getDate()),
                                truncate(translateExpenseType(expense.getType()), 18),
                                formatDecimal(expense.getCost(), 2) + " €",
                                truncate(safeText(expense.getDescription()), 60)
                        })
                        .toList());

        return buildStyledPdf(
                "Informe de gastos",
                vehicleTitle(vehicle),
                rangeLabel(startDate, endDate),
                true,
                metrics,
                table,
                "Totales: registros=" + expenses.size() + " coste=" + formatDecimal(totals.totalExpenseCost(), 2));
    }

    private byte[] buildSummaryPdf(Vehicle vehicle, List<FuelEntry> fuelings, List<Expense> expenses,
            LocalDate startDate, LocalDate endDate) {
        SummaryTotals totals = calculateTotals(fuelings, expenses);

        List<PdfMetric> metrics = List.of(
                new PdfMetric("Repostajes", String.valueOf(totals.fuelingCount()), new Color(20, 184, 166)),
                new PdfMetric("Gastos", String.valueOf(totals.expenseCount()), new Color(245, 158, 11)),
                new PdfMetric("Km", formatDecimal(totals.totalDistance(), 2), new Color(15, 118, 110)),
                new PdfMetric("Coste total", formatDecimal(totals.totalFuelCost().add(totals.totalExpenseCost()), 2),
                        new Color(59, 130, 246)));

        PdfTable table = new PdfTable(
                "Resumen global",
                new String[] { "Métrica", "Valor" },
                new int[] { 42, 24 },
                List.of(
                        new String[] { "Repostajes", String.valueOf(totals.fuelingCount()) },
                        new String[] { "Gastos", String.valueOf(totals.expenseCount()) },
                        new String[] { "Km recorridos", formatDecimal(totals.totalDistance(), 2) },
                        new String[] { "Litros repostados", formatDecimal(totals.totalLiters(), 2) },
                        new String[] { "Coste combustible", formatDecimal(totals.totalFuelCost(), 2) },
                        new String[] { "Coste gastos", formatDecimal(totals.totalExpenseCost(), 2) },
                        new String[] { "Consumo medio", formatDecimal(totals.averageConsumption(), 2) },
                        new String[] { "Coste por 100 km", formatDecimal(totals.costPer100Km(), 2) },
                        new String[] { "Precio medio combustible", formatDecimal(totals.averageFuelPrice(), 3) },
                        new String[] { "Gasto medio", formatDecimal(totals.averageExpenseCost(), 2) }));

        return buildStyledPdf(
                "Resumen global",
                vehicleTitle(vehicle),
                rangeLabel(startDate, endDate),
                false,
                metrics,
                table,
                "Visión rápida de actividad y coste del vehículo en el periodo seleccionado.");
    }

    private SummaryTotals calculateTotals(List<FuelEntry> fuelings, List<Expense> expenses) {
        BigDecimal totalDistance = BigDecimal.ZERO;
        BigDecimal totalLiters = BigDecimal.ZERO;
        BigDecimal totalFuelCost = BigDecimal.ZERO;
        BigDecimal totalExpenseCost = BigDecimal.ZERO;

        for (FuelEntry fueling : fuelings) {
            totalDistance = totalDistance.add(nullToZero(fueling.getDistance()));
            totalLiters = totalLiters.add(nullToZero(fueling.getLiters()));
            totalFuelCost = totalFuelCost.add(nullToZero(fueling.getPriceTotal()));
        }

        for (Expense expense : expenses) {
            totalExpenseCost = totalExpenseCost.add(nullToZero(expense.getCost()));
        }

        return new SummaryTotals(fuelings.size(), expenses.size(), totalDistance, totalLiters, totalFuelCost,
                totalExpenseCost);
    }

    private byte[] buildStyledPdf(
            String title,
            String subtitle,
            String period,
            boolean landscape,
            List<PdfMetric> metrics,
            PdfTable table,
            String footerNote) {

        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {

            try (PdfReportWriter writer = new PdfReportWriter(document, landscape)) {
                writer.writeDocument(title, subtitle, period, metrics, table, footerNote);
            }

            document.save(output);
            return output.toByteArray();

        } catch (Exception exception) {
            exception.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo generar el PDF", exception);
        }
    }

    private String rangeLabel(LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return "Todo el historial";
        }

        if (startDate != null && endDate != null) {
            return formatDate(startDate) + " - " + formatDate(endDate);
        }

        if (startDate != null) {
            return "Desde " + formatDate(startDate);
        }

        return "Hasta " + formatDate(endDate);
    }

    private String rangeFileLabel(LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return "todo";
        }

        if (startDate != null && endDate != null) {
            return FILE_DATE_FORMAT.format(startDate) + "_" + FILE_DATE_FORMAT.format(endDate);
        }

        if (startDate != null) {
            return FILE_DATE_FORMAT.format(startDate) + "_en_adelante";
        }

        return "hasta_" + FILE_DATE_FORMAT.format(endDate);
    }

    private String vehicleTitle(Vehicle vehicle) {
        String brand = safeText(vehicle.getBrand());
        String model = safeText(vehicle.getModel());
        String plate = safeText(vehicle.getPlate());

        if (!plate.isBlank()) {
            return (brand + " " + model + " " + plate).trim();
        }

        return (brand + " " + model).trim();
    }

    private String slug(String value) {
        return value.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "");
    }

    private String formatDate(LocalDate date) {
        return date == null ? "-" : DATE_FORMAT.format(date);
    }

    private String stringOrDash(Object value) {
        return value == null ? "-" : value.toString();
    }

    private static String safeText(String value) {
        return value == null ? "" : value.replace("\r", " ").replace("\n", " ").trim();
    }

    private String truncate(String value, int maxLength) {
        String text = safeText(value);

        if (text.length() <= maxLength) {
            return text;
        }

        if (maxLength <= 1) {
            return text.substring(0, maxLength);
        }

        return text.substring(0, maxLength - 3) + "...";
    }

    private String formatDecimal(BigDecimal value, int scale) {
        if (value == null) {
            return "-";
        }

        return value.setScale(scale, RoundingMode.HALF_UP).stripTrailingZeros().toPlainString();
    }

    private BigDecimal nullToZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private record SummaryTotals(
            int fuelingCount,
            int expenseCount,
            BigDecimal totalDistance,
            BigDecimal totalLiters,
            BigDecimal totalFuelCost,
            BigDecimal totalExpenseCost) {

        private BigDecimal averageConsumption() {
            if (totalDistance.signum() == 0) {
                return BigDecimal.ZERO;
            }

            return totalLiters.multiply(BigDecimal.valueOf(100)).divide(totalDistance, 2, RoundingMode.HALF_UP);
        }

        private BigDecimal costPer100Km() {
            if (totalDistance.signum() == 0) {
                return BigDecimal.ZERO;
            }

            return totalFuelCost.multiply(BigDecimal.valueOf(100)).divide(totalDistance, 2, RoundingMode.HALF_UP);
        }

        private BigDecimal averageFuelPrice() {
            if (totalLiters.signum() == 0) {
                return BigDecimal.ZERO;
            }

            return totalFuelCost.divide(totalLiters, 3, RoundingMode.HALF_UP);
        }

        private BigDecimal averageExpenseCost() {
            if (expenseCount == 0) {
                return BigDecimal.ZERO;
            }

            return totalExpenseCost.divide(BigDecimal.valueOf(expenseCount), 2, RoundingMode.HALF_UP);
        }
    }

    private record PdfMetric(String label, String value, Color accent) {
    }

    private record PdfTable(String title, String[] headers, int[] widths, List<String[]> rows) {
    }

    private static final class PdfReportWriter implements AutoCloseable {

        private static final Color TEAL = new Color(20, 184, 166);
        private static final Color TEAL_DARK = new Color(15, 118, 110);
        private static final Color SLATE_950 = new Color(2, 6, 23);
        private static final Color SLATE_900 = new Color(15, 23, 42);
        private static final Color SLATE_300 = new Color(203, 213, 225);
        private static final Color SLATE_500 = new Color(100, 116, 139);
        private static final Color WHITE = Color.WHITE;

        private final PDDocument document;
        private final PDRectangle pageSize;
        private final float pageWidth;
        private final float pageHeight;
        private final float margin = 34f;
        private final float topBandHeight = 72f;
        private final float footerHeight = 24f;
        private final float cardGap = 10f;
        private final PDFont titleFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        private final PDFont textFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
        private final PDFont textBoldFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);

        private PDPage page;
        private PDPageContentStream content;
        private float cursorY;
        private int pageNumber;

        private PdfReportWriter(PDDocument document, boolean landscape) throws Exception {
            this.document = document;
            this.pageSize = landscape
                    ? new PDRectangle(PDRectangle.A4.getHeight(), PDRectangle.A4.getWidth())
                    : PDRectangle.A4;
            this.pageWidth = pageSize.getWidth();
            this.pageHeight = pageSize.getHeight();
            newPage();
        }

        private void writeDocument(
                String title,
                String subtitle,
                String period,
                List<PdfMetric> metrics,
                PdfTable table,
                String footerNote) throws Exception {

            renderHero(title, subtitle, period);
            if (metrics != null && !metrics.isEmpty()) {
                renderMetrics(metrics);
            }

            if (table != null) {
                renderTable(table);
            }

            renderFooter(footerNote);
        }

        private void renderHero(String title, String subtitle, String period) throws Exception {
            drawBand(0, pageHeight - topBandHeight, pageWidth, topBandHeight, TEAL_DARK);

            beginText(titleFont, 20f, 42f, pageHeight - 28f, WHITE);
            showText(title);
            endText();

            beginText(textFont, 10.5f, 42f, pageHeight - 48f, new Color(240, 253, 250));
            showText(subtitle == null || subtitle.isBlank() ? "" : subtitle);
            endText();

            beginText(textFont, 9.5f, 42f, pageHeight - 63f, new Color(209, 250, 229));
            showText(period == null || period.isBlank() ? "" : period);
            endText();

            cursorY = pageHeight - topBandHeight - 18f;
        }

        private void renderMetrics(List<PdfMetric> metrics) throws Exception {
            int columns = Math.min(4, metrics.size());
            float availableWidth = pageWidth - (margin * 2);
            float cardWidth = (availableWidth - (cardGap * (columns - 1))) / columns;
            float cardHeight = 54f;
            int rows = (int) Math.ceil(metrics.size() / (double) columns);

            for (int row = 0; row < rows; row++) {
                ensureSpace(cardHeight + 10f);

                float rowTop = cursorY;

                for (int column = 0; column < columns; column++) {
                    int index = row * columns + column;

                    if (index >= metrics.size()) {
                        continue;
                    }

                    float x = margin + (column * (cardWidth + cardGap));
                    PdfMetric metric = metrics.get(index);

                    drawCard(x, rowTop - cardHeight, cardWidth, cardHeight, metric.accent());

                    beginText(textBoldFont, 8.5f, x + 12f, rowTop - 18f, SLATE_500);
                    showText(metric.label().toUpperCase(Locale.ROOT));
                    endText();

                    beginText(titleFont, 15.5f, x + 12f, rowTop - 38f, SLATE_900);
                    showText(metric.value());
                    endText();
                }

                cursorY -= cardHeight + cardGap;
            }

            cursorY -= 2f;
        }

        private void renderTable(PdfTable table) throws Exception {
            float sectionGap = 10f;
            float tableTitleHeight = 18f;
            float headerHeight = 24f;
            float rowHeight = 20f;
            float availableWidth = pageWidth - (margin * 2);

            ensureSpace(tableTitleHeight + headerHeight + rowHeight + 20f);

            beginText(textBoldFont, 13f, margin, cursorY, SLATE_900);
            showText(table.title());
            endText();
            cursorY -= sectionGap;

            drawBand(margin, cursorY - headerHeight, availableWidth, headerHeight, TEAL);
            renderRowText(table.headers(), table.widths(), margin, cursorY - 16f, headerHeight, true, false);
            cursorY -= headerHeight;

            for (int rowIndex = 0; rowIndex < table.rows().size(); rowIndex++) {
                String[] row = table.rows().get(rowIndex);
                float estimatedHeight = rowHeight;

                ensureSpace(estimatedHeight + 8f);

                Color rowColor = rowIndex % 2 == 0 ? new Color(248, 250, 252) : new Color(241, 245, 249);
                drawBand(margin, cursorY - rowHeight, availableWidth, rowHeight, rowColor);
                renderRowText(row, table.widths(), margin, cursorY - 14f, rowHeight, false, true);
                cursorY -= rowHeight;
            }

            cursorY -= 6f;
        }

        private void renderFooter(String footerNote) throws Exception {
            if (footerNote != null && !footerNote.isBlank()) {
                ensureSpace(28f);
                beginText(textFont, 8.5f, margin, footerHeight + 2f, SLATE_500);
                showText(footerNote);
                endText();
            }

            String pageLabel = "Página " + pageNumber;
            beginText(textFont, 8.5f, pageWidth - margin - 56f, footerHeight + 2f, SLATE_500);
            showText(pageLabel);
            endText();
        }

        private void renderRowText(String[] values, int[] widths, float startX, float baselineY, float rowHeight,
                boolean header, boolean truncateLong) throws Exception {
            float innerX = startX;
            float availableWidth = pageWidth - (margin * 2);
            Color textColor = header ? WHITE : SLATE_900;
            PDFont font = header ? textBoldFont : textFont;
            float fontSize = header ? 9f : 8.8f;

            for (int index = 0; index < widths.length; index++) {
                float cellWidth = columnWidth(widths, index, availableWidth);
                String value = values != null && index < values.length ? safeText(values[index]) : "";
                String fitted = fitText(value, font, fontSize, cellWidth - 10f, truncateLong);

                beginText(font, fontSize, innerX + 5f, baselineY, textColor);
                showText(fitted);
                endText();

                innerX += cellWidth;
            }
        }

        private float columnWidth(int[] widths, int index, float availableWidth) {
            int total = 0;
            for (int width : widths) {
                total += width;
            }
            return availableWidth * (widths[index] / (float) total);
        }

        private void drawBand(float x, float y, float width, float height, Color color) throws Exception {
            content.setNonStrokingColor(color);
            content.addRect(x, y, width, height);
            content.fill();
        }

        private void drawCard(float x, float y, float width, float height, Color accent) throws Exception {
            content.setNonStrokingColor(new Color(255, 255, 255));
            content.addRect(x, y, width, height);
            content.fill();

            content.setNonStrokingColor(new Color(248, 250, 252));
            content.addRect(x, y, width, height);
            content.stroke();

            content.setNonStrokingColor(accent);
            content.addRect(x, y, 6f, height);
            content.fill();
        }

        private void ensureSpace(float needed) throws Exception {
            if (cursorY - needed > footerHeight + 16f) {
                return;
            }

            newPage();
        }

        private void newPage() throws Exception {
            closePage();
            page = new PDPage(pageSize);
            document.addPage(page);
            content = new PDPageContentStream(document, page);
            cursorY = pageHeight - 24f;
            pageNumber += 1;
        }

        private void closePage() throws Exception {
            if (content != null) {
                content.close();
            }
        }

        private void beginText(PDFont font, float size, float x, float y, Color color) throws Exception {
            content.beginText();
            content.setFont(font, size);
            content.setNonStrokingColor(color);
            content.newLineAtOffset(x, y);
        }

        private void showText(String text) throws Exception {
            content.showText(escapePdfText(text));
        }

        private void endText() throws Exception {
            content.endText();
        }

        private String fitText(String value, PDFont font, float fontSize, float maxWidth, boolean truncateLong)
                throws Exception {
            String text = safeText(value);

            if (text.isEmpty()) {
                return "";
            }

            while (font.getStringWidth(text) / 1000f * fontSize > maxWidth && text.length() > 1) {
                text = text.substring(0, text.length() - 1);
            }

            if (truncateLong && !text.equals(value) && text.length() > 3) {
                text = text.substring(0, Math.max(0, text.length() - 3)) + "...";
            }

            return text;
        }

        private String escapePdfText(String text) {
            if (text == null) {
                return "";
            }

            return text.replace("\r", " ").replace("\n", " ");
        }

        @Override
        public void close() throws Exception {
            closePage();
        }
    }

    private String translateExpenseType(Object typeObj) {
        if (typeObj == null)
            return "-";
        return switch (typeObj.toString().toLowerCase(Locale.ROOT)) {
            case "maintenance" -> "Mantenimiento";
            case "repair" -> "Reparación";
            case "insurance" -> "Seguro";
            case "fines" -> "Multas";
            case "oil" -> "Aceite";
            case "toll" -> "Peaje";
            case "washing" -> "Lavado";
            case "taxes" -> "Impuestos";
            case "inspection" -> "Inspección";
            case "homologation" -> "Homologación";
            case "tuning" -> "Tuning";
            case "tire_change" -> "Neumáticos";
            case "financing" -> "Financiación";
            case "spare_parts" -> "Repuestos";
            case "parking" -> "Parking";
            case "matriculation" -> "Matriculación";
            default -> typeObj.toString();
        };
    }

    private String translateFuelType(Object typeObj) {
        if (typeObj == null)
            return "-";
        return switch (typeObj.toString().toLowerCase(Locale.ROOT)) {
            case "gasoline95" -> "Gasolina 95";
            case "gasoline98" -> "Gasolina 98";
            case "diesel" -> "Diésel";
            case "diesel_premium" -> "Diésel Premium";
            case "electricity" -> "Electricidad";
            case "lpg" -> "GLP";
            case "cng" -> "GNC";
            default -> typeObj.toString();
        };
    }

    private String translateRefuelingType(Object typeObj) {
        if (typeObj == null)
            return "-";
        return switch (typeObj.toString().toLowerCase(Locale.ROOT)) {
            case "complete" -> "Lleno";
            case "partial" -> "Parcial";
            case "initial" -> "Inicial";
            default -> typeObj.toString();
        };
    }
}