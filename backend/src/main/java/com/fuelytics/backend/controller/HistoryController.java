package com.fuelytics.backend.controller;
import java.security.Principal;
import org.springframework.web.bind.annotation.*;
import com.fuelytics.backend.service.HistoryService;
import com.fuelytics.backend.dto.*;
@RestController
@RequestMapping("/api")
public class HistoryController {
    private final HistoryService history;
    public HistoryController(HistoryService history) { this.history = history; }
    @GetMapping("/fuelings/vehicle/{id}/page")
    public HistoryPage<FuelingHistoryRow> fuelings(@PathVariable Integer id, Principal principal,
            @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "15") int size) {
        return history.fuelings(id, principal.getName(), page, size);
    }
    @GetMapping("/expenses/vehicle/{id}/page")
    public HistoryPage<ExpenseResponseDTO> expenses(@PathVariable Integer id, Principal principal,
            @RequestParam(defaultValue = "1") int page, @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) Integer year) {
        return history.expenses(id, principal.getName(), page, size, year == null ? java.time.LocalDate.now().getYear() : year);
    }
}
