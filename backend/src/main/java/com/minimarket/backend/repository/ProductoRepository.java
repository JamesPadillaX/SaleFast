package com.minimarket.backend.repository;

import com.minimarket.backend.model.Producto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, UUID> {
    Optional<Producto> findByCodigoBarrasAndActivoTrue(String codigoBarras);
    Optional<Producto> findByCodigoBarras(String codigoBarras);

    Page<Producto> findByActivoTrue(Pageable pageable);

    @Query("SELECT p FROM Producto p WHERE p.activo = true AND " +
           "(LOWER(p.nombre) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "p.codigoBarras LIKE CONCAT('%', :query, '%'))")
    Page<Producto> searchProducts(String query, Pageable pageable);

    Page<Producto> findByCategoriaIdAndActivoTrue(UUID categoriaId, Pageable pageable);

    @Query("SELECT p FROM Producto p LEFT JOIN FETCH p.categoria WHERE p.activo = true AND p.stock <= p.stockMinimo")
    List<Producto> findLowStockProducts();

    @Query("SELECT COUNT(p) FROM Producto p WHERE p.activo = true")
    long countActiveProducts();
}

