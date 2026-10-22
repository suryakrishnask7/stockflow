package com.stockflow.service;

import com.stockflow.dto.request.ProductRequest;
import com.stockflow.dto.response.ProductResponse;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.entity.*;
import com.stockflow.exception.DuplicateResourceException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final InventoryBalanceRepository inventoryBalanceRepository;

    public PageResponse<ProductResponse> searchProducts(String search, Long categoryId,
                                                        String status, Long supplierId, Pageable pageable) {
        Product.Status statusEnum = null;
        if (status != null && !status.isBlank()) {
            try { statusEnum = Product.Status.valueOf(status.toUpperCase()); }
            catch (IllegalArgumentException ignored) {}
        }
        Page<Product> page = productRepository.searchProducts(
                search != null && search.isBlank() ? null : search,
                categoryId, statusEnum, supplierId, pageable);
        Page<ProductResponse> responsePage = page.map(this::toResponse);
        return PageResponse.from(responsePage);
    }

    public ProductResponse getProduct(Long id) {
        Product product = productRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        return toResponseWithInventory(product);
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request, User currentUser) {
        if (productRepository.existsBySku(request.getSku())) {
            throw new DuplicateResourceException("Product with SKU '" + request.getSku() + "' already exists");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));

        Supplier supplier = null;
        if (request.getPrimarySupplierId() != null) {
            supplier = supplierRepository.findById(request.getPrimarySupplierId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier", request.getPrimarySupplierId()));
        }

        Product product = Product.builder()
                .sku(request.getSku().toUpperCase())
                .name(request.getName())
                .description(request.getDescription())
                .category(category)
                .primarySupplier(supplier)
                .unitCost(request.getUnitCost())
                .sellingPrice(request.getSellingPrice())
                .reorderLevel(request.getReorderLevel())
                .reorderQuantity(request.getReorderQuantity())
                .unitOfMeasure(request.getUnitOfMeasure())
                .barcode(request.getBarcode())
                .status(Product.Status.ACTIVE)
                .createdBy(currentUser)
                .build();

        product = productRepository.save(product);
        log.info("Created product SKU='{}' by user='{}'", product.getSku(), currentUser.getUsername());
        return toResponse(product);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));

        if (!product.getSku().equals(request.getSku()) && productRepository.existsBySkuAndIdNot(request.getSku(), id)) {
            throw new DuplicateResourceException("Product with SKU '" + request.getSku() + "' already exists");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));

        Supplier supplier = null;
        if (request.getPrimarySupplierId() != null) {
            supplier = supplierRepository.findById(request.getPrimarySupplierId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier", request.getPrimarySupplierId()));
        }

        product.setSku(request.getSku().toUpperCase());
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setCategory(category);
        product.setPrimarySupplier(supplier);
        product.setUnitCost(request.getUnitCost());
        product.setSellingPrice(request.getSellingPrice());
        product.setReorderLevel(request.getReorderLevel());
        product.setReorderQuantity(request.getReorderQuantity());
        product.setUnitOfMeasure(request.getUnitOfMeasure());
        product.setBarcode(request.getBarcode());

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse updateStatus(Long id, String status) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        product.setStatus(Product.Status.valueOf(status.toUpperCase()));
        return toResponse(productRepository.save(product));
    }

    private ProductResponse toResponse(Product product) {
        // Get total quantity across all warehouses
        List<InventoryBalance> balances = inventoryBalanceRepository.findByProductId(product.getId());
        int totalQty = balances.stream().mapToInt(InventoryBalance::getQuantity).sum();
        BigDecimal totalValue = product.getUnitCost().multiply(BigDecimal.valueOf(totalQty));

        String stockStatus;
        if (totalQty == 0) stockStatus = "OUT_OF_STOCK";
        else if (totalQty <= product.getReorderLevel()) stockStatus = "LOW_STOCK";
        else stockStatus = "IN_STOCK";

        return buildResponse(product, totalQty, totalValue, stockStatus);
    }

    private ProductResponse toResponseWithInventory(Product product) {
        return toResponse(product);
    }

    private ProductResponse buildResponse(Product p, int totalQty, BigDecimal totalValue, String stockStatus) {
        return ProductResponse.builder()
                .id(p.getId())
                .sku(p.getSku())
                .name(p.getName())
                .description(p.getDescription())
                .category(p.getCategory() != null ?
                        ProductResponse.CategoryRef.builder()
                                .id(p.getCategory().getId())
                                .name(p.getCategory().getName())
                                .build() : null)
                .primarySupplier(p.getPrimarySupplier() != null ?
                        ProductResponse.SupplierRef.builder()
                                .id(p.getPrimarySupplier().getId())
                                .name(p.getPrimarySupplier().getName())
                                .code(p.getPrimarySupplier().getCode())
                                .build() : null)
                .unitCost(p.getUnitCost())
                .sellingPrice(p.getSellingPrice())
                .reorderLevel(p.getReorderLevel())
                .reorderQuantity(p.getReorderQuantity())
                .unitOfMeasure(p.getUnitOfMeasure())
                .barcode(p.getBarcode())
                .status(p.getStatus().name())
                .totalQuantity(totalQty)
                .totalValue(totalValue)
                .stockStatus(stockStatus)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
