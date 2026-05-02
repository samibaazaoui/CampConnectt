package com.camp.backend.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.client.RestTemplate;
import java.util.List;

@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        // Build RestTemplate with basic configuration
        RestTemplate restTemplate = builder.build();

        // Ensure JSON converter supports application/json content type
        restTemplate.getMessageConverters().stream()
                .filter(c -> c instanceof MappingJackson2HttpMessageConverter)
                .map(c -> (MappingJackson2HttpMessageConverter) c)
                .forEach(c -> c.setSupportedMediaTypes(
                    List.of(MediaType.APPLICATION_JSON, MediaType.APPLICATION_OCTET_STREAM)
                ));

        return restTemplate;
    }
}
