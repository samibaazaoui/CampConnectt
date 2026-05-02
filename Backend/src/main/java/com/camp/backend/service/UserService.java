package com.camp.backend.service;

import com.camp.backend.config.ResourceNotFoundException;
import com.camp.backend.dto.CreateUserRequest;
import com.camp.backend.dto.UserResponse;
import com.camp.backend.entity.User;
import com.camp.backend.entity.UserRole;
import com.camp.backend.repository.UserRepository;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponse create(CreateUserRequest request) {
        User user = new User();
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName());
        user.setRole(request.role() == null ? UserRole.USER : request.role());
        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    public User authenticate(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("Invalid email or password"));

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new ResourceNotFoundException("Invalid email or password");
        }

        return user;
    }

    public List<UserResponse> findAll() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<UserResponse> getTopContributors(int limit) {
        return userRepository.findAll().stream()
            .sorted((u1, u2) -> u2.getKarma().compareTo(u1.getKarma()))
            .limit(limit)
            .map(this::toResponse)
            .toList();
    }

    public UserResponse findById(Long id) {
        return toResponse(getById(id));
    }

    public User getById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    public UserResponse update(Long id, CreateUserRequest request) {
        User user = getById(id);
        user.setEmail(request.email());
        user.setFullName(request.fullName());
        if (request.password() != null && !request.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }
        if (request.role() != null) {
            user.setRole(request.role());
        }
        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    public void delete(Long id) {
        User user = getById(id);
        userRepository.delete(user);
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.getRole(),
            user.getCreatedAt(),
            user.getKarma()
        );
    }
}
