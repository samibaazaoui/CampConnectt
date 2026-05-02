// src/main/java/com/camp/backend/service/SpamCheckService.java
package com.camp.backend.service;

import com.camp.backend.config.BadRequestException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class SpamCheckService {

    private static final Logger log = LoggerFactory.getLogger(SpamCheckService.class);
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ml.service.url:http://localhost:8001}")
    private String mlServiceUrl;

    @Value("${ml.confidence.threshold:0.55}")
    private double confidenceThreshold;

    public SpamCheckService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public void checkSpam(String content) {
        if (content == null || content.trim().isEmpty()) {
            return;
        }

        try {
            String url = mlServiceUrl + "/predict";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            String requestBody = String.format("{\"content\":\"%s\"}", 
                content.replace("\"", "\\\""));
            
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                String.class
            );

            JsonNode jsonResponse = objectMapper.readTree(response.getBody());
            boolean isSpam = jsonResponse.path("is_spam").asBoolean();
            double confidence = jsonResponse.path("confidence").asDouble();
            String method = jsonResponse.path("method").asText();
            boolean hasBadWords = jsonResponse.path("has_bad_words").asBoolean();
            
            // Clean log format (NO EMOJIS)
            log.info("[ML Spam Check] Method: {} | Confidence: {} | Result: {} | HasBadWords: {}", 
                method, 
                String.format("%.2f", confidence), 
                isSpam ? "SPAM" : "HAM",
                hasBadWords);

            if (isSpam && confidence >= confidenceThreshold) {
                String userMessage = hasBadWords 
                    ? "Inappropriate language detected. Please review your content and remove offensive words."
                    : "Content appears to be spam. Please ensure your message is relevant and follows community guidelines.";
                
                throw new BadRequestException(userMessage);
            }

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.warn("ML service unavailable: {}. Proceeding without spam check.", e.getMessage());
        }
    }
}