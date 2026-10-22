package com.stockflow.service;

import com.stockflow.dto.request.SupplierRequest;
import com.stockflow.dto.response.SupplierResponse;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.entity.Supplier;
import com.stockflow.exception.*;
import com.stockflow.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;

    public PageResponse<SupplierResponse> searchSuppliers(String search, String status, Pageable pageable) {
        Supplier.Status statusEnum = null;
        if (status != null && !status.isBlank()) {
            try { statusEnum = Supplier.Status.valueOf(status.toUpperCase()); }
            catch (IllegalArgumentException ignored) {}
        }
        return PageResponse.from(supplierRepository.searchSuppliers(search, statusEnum, pageable)
                .map(this::toResponse));
    }

    public List<SupplierResponse> getAllActive() {
        return supplierRepository.findByStatusOrderByName(Supplier.Status.ACTIVE)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public SupplierResponse getSupplier(Long id) {
        return supplierRepository.findById(id)
                .map(this::toResponseWithCount)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", id));
    }

    @Transactional
    public SupplierResponse createSupplier(SupplierRequest request) {
        if (supplierRepository.existsByCode(request.getCode())) {
            throw new DuplicateResourceException("Supplier with code '" + request.getCode() + "' already exists");
        }
        Supplier supplier = buildSupplier(new Supplier(), request);
        return toResponse(supplierRepository.save(supplier));
    }

    @Transactional
    public SupplierResponse updateSupplier(Long id, SupplierRequest request) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", id));
        if (!supplier.getCode().equals(request.getCode()) &&
            supplierRepository.existsByCodeAndIdNot(request.getCode(), id)) {
            throw new DuplicateResourceException("Supplier with code '" + request.getCode() + "' already exists");
        }
        buildSupplier(supplier, request);
        return toResponse(supplierRepository.save(supplier));
    }

    @Transactional
    public void deactivateSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", id));
        supplier.setStatus(Supplier.Status.INACTIVE);
        supplierRepository.save(supplier);
    }

    private Supplier buildSupplier(Supplier s, SupplierRequest req) {
        s.setCode(req.getCode().toUpperCase());
        s.setName(req.getName());
        s.setContactPerson(req.getContactPerson());
        s.setEmail(req.getEmail());
        s.setPhone(req.getPhone());
        s.setAddressLine1(req.getAddressLine1());
        s.setAddressLine2(req.getAddressLine2());
        s.setCity(req.getCity());
        s.setState(req.getState());
        s.setPostalCode(req.getPostalCode());
        s.setCountry(req.getCountry());
        s.setNotes(req.getNotes());
        return s;
    }

    private SupplierResponse toResponse(Supplier s) {
        return SupplierResponse.builder()
                .id(s.getId()).code(s.getCode()).name(s.getName())
                .contactPerson(s.getContactPerson()).email(s.getEmail()).phone(s.getPhone())
                .addressLine1(s.getAddressLine1()).addressLine2(s.getAddressLine2())
                .city(s.getCity()).state(s.getState()).postalCode(s.getPostalCode())
                .country(s.getCountry()).status(s.getStatus().name())
                .notes(s.getNotes()).createdAt(s.getCreatedAt()).updatedAt(s.getUpdatedAt())
                .build();
    }

    private SupplierResponse toResponseWithCount(Supplier s) {
        SupplierResponse resp = toResponse(s);
        long count = productRepository.countByStatus(com.stockflow.entity.Product.Status.ACTIVE);
        resp.setProductCount((int) count);
        return resp;
    }
}
