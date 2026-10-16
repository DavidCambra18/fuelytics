package com.fuelytics.backend.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fuelytics.backend.dto.RankingProjection;
import com.fuelytics.backend.service.RankingService;

@RestController
@RequestMapping("/api")
public class RankingController {

    private final RankingService rankingService;

    public RankingController(RankingService rankingService) {
        this.rankingService = rankingService;
    }

    @GetMapping("/ranking")
    public ResponseEntity<List<RankingProjection>> getRanking() {
        return ResponseEntity.ok(rankingService.getGlobalRanking());
    }

    @GetMapping("/rankings/friends")
    public ResponseEntity<List<RankingProjection>> getFriendsRanking(Principal principal) {
        return ResponseEntity.ok(rankingService.getFriendsRanking(principal.getName()));
    }
}
