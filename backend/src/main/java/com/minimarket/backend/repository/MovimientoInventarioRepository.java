package com.minimarket.backend.repository;

import com.minimarket.backend.model.MovimientoInventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface MovimientoInventarioRepository extends JpaRepository<MovimientoInventario, UUID> {
    List<MovimientoInventario> findByProductoIdOrderByFechaDesc(UUID productoId);
    List<MovimientoInventario> findTop50ByOrderByFechaDesc();
}

