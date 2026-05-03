package com.camp.backend.controller;

import com.camp.backend.config.JwtUtil;
import com.camp.backend.dto.ApiResponse;
import com.camp.backend.dto.AuthResponse;
import com.camp.backend.dto.CreateUserRequest;
import com.camp.backend.dto.LoginRequest;
import com.camp.backend.dto.UserResponse;
import com.camp.backend.entity.User;
import com.camp.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    public AuthController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody CreateUserRequest request) {
        UserResponse userResponse = userService.create(request);
        String token = jwtUtil.generateToken(
            userResponse.id(),
            userResponse.email(),
            userResponse.role().name()
        );
        AuthResponse authResponse = new AuthResponse(token, userResponse);
        return ResponseEntity.ok(ApiResponse.ok("Registration successful", authResponse));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        User user = userService.authenticate(request.email(), request.password());
        UserResponse userResponse = new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.getRole(),
            user.getCreatedAt()
        );
        String token = jwtUtil.generateToken(
            user.getId(),
            user.getEmail(),
            user.getRole().name()
        );
        AuthResponse authResponse = new AuthResponse(token, userResponse);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", authResponse));
    }
}
