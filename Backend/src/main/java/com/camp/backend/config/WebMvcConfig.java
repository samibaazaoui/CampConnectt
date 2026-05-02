package com.camp.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Expose the local Images directory so the frontend can load them via /images/
        registry.addResourceHandler("/images/**")
                .addResourceLocations("file:///C:/Users/Bechir/Desktop/CAMP/Backend/src/main/resources/Images/");
    }
}
