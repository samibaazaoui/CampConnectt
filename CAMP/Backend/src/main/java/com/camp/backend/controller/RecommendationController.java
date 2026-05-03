package com.camp.backend.controller;

import com.camp.backend.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.Map;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RestTemplate restTemplate;

    @Value("${app.ml-service-url:http://localhost:8000}")
    private String mlServiceUrl;

    public RecommendationController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<Object>> getRecommendations(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "5") int n) {
        try {
            String url = mlServiceUrl + "/recommendations/" + userId + "?n=" + n;
            Object result = restTemplate.getForObject(url, Object.class);
            return ResponseEntity.ok(ApiResponse.ok("Recommendations fetched", result));
        } catch (Exception ex) {
            return ResponseEntity.ok(
                ApiResponse.fail("ML service unavailable: " + ex.getMessage(), null)
            );
        }
    }

    @GetMapping("/model-metrics")
    public ResponseEntity<ApiResponse<Object>> getModelMetrics() {
        try {
            String url = mlServiceUrl + "/model-metrics";
            Object result = restTemplate.getForObject(url, Object.class);
            return ResponseEntity.ok(ApiResponse.ok("Model metrics fetched", result));
        } catch (Exception ex) {
            return ResponseEntity.ok(
                ApiResponse.fail("ML service unavailable: " + ex.getMessage(), null)
            );
        }
    }

    @PostMapping("/predict-participation")
    public ResponseEntity<ApiResponse<Object>> predictParticipationManual(@org.springframework.web.bind.annotation.RequestBody Object body) {
        try {
            String url = mlServiceUrl + "/predict-participation";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Object> entity = new HttpEntity<>(body, headers);
            Object result = restTemplate.postForObject(url, entity, Object.class);
            return ResponseEntity.ok(ApiResponse.ok("Prediction fetched", result));
        } catch (Exception ex) {
            return ResponseEntity.ok(
                ApiResponse.fail("ML service unavailable: " + ex.getMessage(), null)
            );
        }
    }

    @GetMapping("/predict-participation/{eventId}")
    public ResponseEntity<ApiResponse<Object>> predictParticipation(@PathVariable Long eventId) {
        try {
            String url = mlServiceUrl + "/predict-participation";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            String body = "{\"event_id\":" + eventId + "}";
            HttpEntity<String> entity = new HttpEntity<>(body, headers);
            Object result = restTemplate.postForObject(url, entity, Object.class);
            return ResponseEntity.ok(ApiResponse.ok("Prediction fetched", result));
        } catch (Exception ex) {
            return ResponseEntity.ok(
                ApiResponse.fail("ML service unavailable: " + ex.getMessage(), null)
            );
        }
    }
}
