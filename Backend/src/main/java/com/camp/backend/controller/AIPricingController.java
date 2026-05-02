package com.camp.backend.controller;
import com.camp.backend.dto.PredictionResponse;
import com.camp.backend.service.AIPricingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class AIPricingController {

    private final AIPricingService aiPricingService;

    /**
     * POST /api/ai/predict
     *
     * Paramètres form-data :
     *   file             — image du produit (JPEG / PNG)
     *   competitorPrice  — prix concurrent (default 40)
     *   demand           — niveau de demande 0–100 (default 70)
     *   season           — summer | rainy | winter | spring (default summer)
     */
    @PostMapping(value = "/predict", consumes = "multipart/form-data")
    public ResponseEntity<PredictionResponse> predict(
            @RequestParam("file")                        MultipartFile file,
            @RequestParam(value = "competitorPrice",
                    defaultValue = "40.0")         double competitorPrice,
            @RequestParam(value = "demand",
                    defaultValue = "70")           int demand,
            @RequestParam(value = "season",
                    defaultValue = "summer")       String season
    ) {
        PredictionResponse result =
                aiPricingService.predictPrice(file, competitorPrice, demand, season);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("AI Pricing Controller OK");
    }
}
