package com.camp.backend.config;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/campsites").permitAll() // Approved public list
                .requestMatchers(HttpMethod.GET, "/api/campsites/approved").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/campsites/{id:[0-9]+}").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/activities/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/events/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/forum/**").permitAll()
                .requestMatchers("/images/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/upload/**").permitAll()

                // Role-based endpoints - Campsites
                .requestMatchers(HttpMethod.GET, "/api/campsites/all").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/campsites/pending").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/campsites/owner").hasAnyRole("ADMIN", "CAMPSITE_OWNER")
                .requestMatchers(HttpMethod.POST, "/api/campsites").hasAnyRole("ADMIN", "CAMPSITE_OWNER")
                .requestMatchers(HttpMethod.PUT, "/api/campsites/{id}/approve", "/api/campsites/{id}/cancel").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/campsites/**").hasAnyRole("ADMIN", "CAMPSITE_OWNER")
                .requestMatchers(HttpMethod.DELETE, "/api/campsites/**").hasAnyRole("ADMIN", "CAMPSITE_OWNER")

                // Role-based endpoints - Equipment
                .requestMatchers(HttpMethod.GET, "/api/equipments").permitAll() // Approved public list
                .requestMatchers(HttpMethod.GET, "/api/equipments/all").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/equipments/pending").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/equipments/owner").hasAnyRole("ADMIN", "EQUIPMENT_OWNER")
                .requestMatchers(HttpMethod.POST, "/api/equipments").hasAnyRole("ADMIN", "EQUIPMENT_OWNER")
                .requestMatchers(HttpMethod.PUT, "/api/equipments/{id}/approve", "/api/equipments/{id}/cancel").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/equipments/**").hasAnyRole("ADMIN", "EQUIPMENT_OWNER")
                .requestMatchers(HttpMethod.DELETE, "/api/equipments/**").hasAnyRole("ADMIN", "EQUIPMENT_OWNER")

                .requestMatchers(HttpMethod.PUT, "/api/deliveries/*/status").hasRole("ADMIN")

                // Authenticated endpoints (any logged-in user)
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
