package com.camp.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class CampBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(CampBackendApplication.class, args);
    }
}
