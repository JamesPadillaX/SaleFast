package com.minimarket.backend.repository;

import com.minimarket.backend.model.Venta;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface VentaRepository extends JpaRepository<Venta, UUID> {

    @Query("SELECT COALESCE(SUM(v.total), 0) FROM Venta v WHERE v.fecha >= :start AND v.fecha <= :end")
    BigDecimal sumTotalSalesBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(v) FROM Venta v WHERE v.fecha >= :start AND v.fecha <= :end")
    long countSalesBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT v.metodoPago, COALESCE(SUM(v.total), 0) FROM Venta v WHERE v.fecha >= :start AND v.fecha <= :end GROUP BY v.metodoPago")
    List<Object[]> sumSalesByMetodoPagoBetween(LocalDateTime start, LocalDateTime end);

    @EntityGraph(attributePaths = {"cliente", "usuario", "detalles", "detalles.producto", "detalles.producto.categoria"})
    @Query("SELECT v FROM Venta v WHERE v.fecha >= :start AND v.fecha <= :end ORDER BY v.fecha DESC")
    List<Venta> findSalesBetween(LocalDateTime start, LocalDateTime end);

    @EntityGraph(attributePaths = {"cliente", "usuario", "detalles", "detalles.producto", "detalles.producto.categoria"})
    List<Venta> findTop10ByOrderByFechaDesc();

    @EntityGraph(attributePaths = {"cliente", "usuario", "detalles", "detalles.producto", "detalles.producto.categoria"})
    @Query("SELECT v FROM Venta v ORDER BY v.fecha DESC")
    List<Venta> findAllOrderByFechaDesc();

    @Query("SELECT dv.producto.nombre, SUM(dv.cantidad) as totalQty " +
           "FROM DetalleVenta dv " +
           "GROUP BY dv.producto.nombre " +
           "ORDER BY totalQty DESC")
    List<Object[]> findTopSellingProducts();

    @Query("SELECT dv.producto.nombre, SUM(dv.cantidad) as totalQty " +
           "FROM DetalleVenta dv " +
           "GROUP BY dv.producto.nombre " +
           "ORDER BY totalQty ASC")
    List<Object[]> findLeastSellingProducts();
}

