package com.camp.backend.service;

import com.camp.backend.dto.PredictionResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIPricingService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    /**
     * Envoie l'image + métadonnées au service Python et retourne
     * un objet PredictionResponse structuré.
     */
    public PredictionResponse predictPrice(
            MultipartFile image,
            double competitorPrice,
            int demand,
            String season
    ) {
        String url = aiServiceUrl + "/predict-price";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file",             image.getResource());
        body.add("competitor_price", String.valueOf(competitorPrice));
        body.add("demand",           String.valueOf(demand));
        body.add("season",           season);

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        log.info("Appel AI service → {} | competitor={} demand={} season={}",
                url, competitorPrice, demand, season);

        try {
            ResponseEntity<String> raw =
                    restTemplate.postForEntity(url, request, String.class);

            PredictionResponse response =
                    objectMapper.readValue(raw.getBody(), PredictionResponse.class);

            log.info("Prix recommandé reçu : {} dt", response.getRecommendedPrice());
            return response;

        } catch (Exception ex) {
            log.error("Erreur lors de l'appel au service AI : {}", ex.getMessage());
            throw new RuntimeException("Service IA indisponible", ex);
        }
    }
}
