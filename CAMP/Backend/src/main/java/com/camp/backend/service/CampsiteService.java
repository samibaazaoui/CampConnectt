package com.camp.backend.service;

import com.camp.backend.config.ResourceNotFoundException;
import com.camp.backend.dto.CampsiteResponse;
import com.camp.backend.dto.CreateCampsiteRequest;
import com.camp.backend.entity.ApprovalStatus;
import com.camp.backend.entity.Campsite;
import com.camp.backend.entity.User;
import com.camp.backend.repository.CampsiteRepository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CampsiteService {

    private final CampsiteRepository campsiteRepository;
    private final UserService userService;

    public CampsiteService(CampsiteRepository campsiteRepository, UserService userService) {
        this.campsiteRepository = campsiteRepository;
        this.userService = userService;
    }

    public CampsiteResponse create(CreateCampsiteRequest request, Long ownerId) {
        User owner = userService.getById(ownerId);
        Campsite campsite = new Campsite();
        campsite.setName(request.name());
        campsite.setLocation(request.location());
        campsite.setCapacity(request.capacity());
        campsite.setNightlyPrice(request.nightlyPrice());
        campsite.setImageUrl(request.imageUrl());
        campsite.setOwner(owner);
        campsite.setApprovalStatus(ApprovalStatus.PENDING);
        Campsite saved = campsiteRepository.save(campsite);
        return toResponse(saved);
    }

    public List<CampsiteResponse> findAllApproved() {
        return campsiteRepository.findByApprovalStatus(ApprovalStatus.APPROVED).stream().map(this::toResponse).toList();
    }

    public List<CampsiteResponse> findAll() {
        return campsiteRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<CampsiteResponse> findPending() {
        return campsiteRepository.findByApprovalStatus(ApprovalStatus.PENDING).stream().map(this::toResponse).toList();
    }

    public List<CampsiteResponse> findByOwnerId(Long ownerId) {
        return campsiteRepository.findByOwnerId(ownerId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public CampsiteResponse approve(Long id) {
        Campsite campsite = getById(id);
        campsite.setApprovalStatus(ApprovalStatus.APPROVED);
        return toResponse(campsiteRepository.save(campsite));
    }

    @Transactional
    public CampsiteResponse cancel(Long id) {
        Campsite campsite = getById(id);
        campsite.setApprovalStatus(ApprovalStatus.CANCELLED);
        return toResponse(campsiteRepository.save(campsite));
    }

    public Page<CampsiteResponse> findAllPageable(Pageable pageable) {
        return campsiteRepository.findAll(pageable).map(this::toResponse);
    }

    public Page<CampsiteResponse> findAllApprovedPageable(Pageable pageable) {
        return campsiteRepository.findByApprovalStatus(ApprovalStatus.APPROVED, pageable).map(this::toResponse);
    }

    public CampsiteResponse findById(Long id) {
        return toResponse(getById(id));
    }

    public Campsite getById(Long id) {
        return campsiteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Campsite not found: " + id));
    }

    public CampsiteResponse update(Long id, CreateCampsiteRequest request) {
        Campsite campsite = getById(id);
        campsite.setName(request.name());
        campsite.setLocation(request.location());
        campsite.setCapacity(request.capacity());
        campsite.setNightlyPrice(request.nightlyPrice());
        campsite.setImageUrl(request.imageUrl());
        Campsite saved = campsiteRepository.save(campsite);
        return toResponse(saved);
    }

    public void delete(Long id) {
        Campsite campsite = getById(id);
        campsiteRepository.delete(campsite);
    }

    private CampsiteResponse toResponse(Campsite campsite) {
        return new CampsiteResponse(
            campsite.getId(),
            campsite.getName(),
            campsite.getLocation(),
            campsite.getCapacity(),
            campsite.getNightlyPrice(),
            campsite.getImageUrl(),
            campsite.getOwner() != null ? campsite.getOwner().getId() : null,
            campsite.getOwner() != null ? campsite.getOwner().getFullName() : null,
            campsite.getApprovalStatus()
        );
    }
}
