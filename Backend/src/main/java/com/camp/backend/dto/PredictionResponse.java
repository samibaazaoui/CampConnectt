package com.camp.backend.dto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.Map;

@Data
public class PredictionResponse {

    @JsonProperty("request_id")
    private String requestId;

    @JsonProperty("features")
    private ProductFeatures features;

    @JsonProperty("recommended_price")
    private double recommendedPrice;

    @JsonProperty("confidence_range")
    private Map<String, Double> confidenceRange;

    @Data
    public static class ProductFeatures {
        private String brand;
        private String material;

        @JsonProperty("waterproof_level")
        private double waterproofLevel;

        private int demand;
        private String season;

        @JsonProperty("competitor_price")
        private double competitorPrice;
    }
}
