package com.camp.backend.controller;

import com.camp.backend.dto.ApiResponse;
import com.camp.backend.dto.CreateUserRequest;
import com.camp.backend.dto.UserResponse;
import com.camp.backend.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> create(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("User created", userService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.ok("Users fetched", userService.findAll()));
    }

    @GetMapping("/top-contributors")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getTopContributors(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.ok("Top contributors fetched", userService.getTopContributors(limit)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("User fetched", userService.findById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> update(@PathVariable Long id, @Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("User updated", userService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("User deleted", null));
    }
}
