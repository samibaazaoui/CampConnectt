package com.camp.backend.service;

import com.camp.backend.config.ResourceNotFoundException;
import com.camp.backend.dto.CreateEquipmentRequest;
import com.camp.backend.dto.EquipmentResponse;
import com.camp.backend.entity.ApprovalStatus;
import com.camp.backend.entity.Equipment;
import com.camp.backend.entity.User;
import com.camp.backend.repository.EquipmentRepository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final UserService userService;

    public EquipmentService(EquipmentRepository equipmentRepository, UserService userService) {
        this.equipmentRepository = equipmentRepository;
        this.userService = userService;
    }

    public EquipmentResponse create(CreateEquipmentRequest request, Long ownerId) {
        User owner = userService.getById(ownerId);
        Equipment equipment = new Equipment();
        equipment.setName(request.name());
        equipment.setDescription(request.description());
        equipment.setQuantityInStock(request.quantityInStock());
        equipment.setUnitPrice(request.unitPrice());
        equipment.setImageUrl(request.imageUrl());
        equipment.setOwner(owner);
        equipment.setApprovalStatus(ApprovalStatus.PENDING);
        Equipment saved = equipmentRepository.save(equipment);
        return toResponse(saved);
    }

    public List<EquipmentResponse> findAllApproved() {
        return equipmentRepository.findByApprovalStatus(ApprovalStatus.APPROVED).stream().map(this::toResponse).toList();
    }

    public List<EquipmentResponse> findAll() {
        return equipmentRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<EquipmentResponse> findPending() {
        return equipmentRepository.findByApprovalStatus(ApprovalStatus.PENDING).stream().map(this::toResponse).toList();
    }

    public List<EquipmentResponse> findByOwnerId(Long ownerId) {
        return equipmentRepository.findByOwnerId(ownerId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public EquipmentResponse approve(Long id) {
        Equipment equipment = getById(id);
        equipment.setApprovalStatus(ApprovalStatus.APPROVED);
        return toResponse(equipmentRepository.save(equipment));
    }

    @Transactional
    public EquipmentResponse cancel(Long id) {
        Equipment equipment = getById(id);
        equipment.setApprovalStatus(ApprovalStatus.CANCELLED);
        return toResponse(equipmentRepository.save(equipment));
    }

    public Page<EquipmentResponse> findAllPageable(Pageable pageable) {
        return equipmentRepository.findAll(pageable).map(this::toResponse);
    }

    public Page<EquipmentResponse> findAllApprovedPageable(Pageable pageable) {
        return equipmentRepository.findByApprovalStatus(ApprovalStatus.APPROVED, pageable).map(this::toResponse);
    }

    public EquipmentResponse findById(Long id) {
        return toResponse(getById(id));
    }

    public Equipment getById(Long id) {
        return equipmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Equipment not found: " + id));
    }

    public EquipmentResponse update(Long id, CreateEquipmentRequest request) {
        Equipment equipment = getById(id);
        equipment.setName(request.name());
        equipment.setDescription(request.description());
        equipment.setQuantityInStock(request.quantityInStock());
        equipment.setUnitPrice(request.unitPrice());
        equipment.setImageUrl(request.imageUrl());
        Equipment saved = equipmentRepository.save(equipment);
        return toResponse(saved);
    }

    public void delete(Long id) {
        Equipment equipment = getById(id);
        equipmentRepository.delete(equipment);
    }

    private EquipmentResponse toResponse(Equipment equipment) {
        return new EquipmentResponse(
            equipment.getId(),
            equipment.getName(),
            equipment.getDescription(),
            equipment.getQuantityInStock(),
            equipment.getUnitPrice(),
            equipment.getImageUrl(),
            equipment.getOwner() != null ? equipment.getOwner().getId() : null,
            equipment.getOwner() != null ? equipment.getOwner().getFullName() : null,
            equipment.getApprovalStatus()
        );
    }
}
