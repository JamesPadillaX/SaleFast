package com.minimarket.backend.repository;

import com.minimarket.backend.model.Compra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface CompraRepository extends JpaRepository<Compra, UUID> {
}

