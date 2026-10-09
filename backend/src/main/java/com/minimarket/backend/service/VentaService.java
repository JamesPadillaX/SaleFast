package com.minimarket.backend.service;

import com.minimarket.backend.model.*;
import com.minimarket.backend.repository.ProductoRepository;
import com.minimarket.backend.repository.VentaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class VentaService {

    @Autowired
    private VentaRepository ventaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private InventarioService inventarioService;

    // Tasa de IGV por defecto (18% = 0.18)
    private static final BigDecimal IGV_RATE = new BigDecimal("0.18");

    @Transactional
    public Venta registrarVenta(Venta venta, Usuario usuario) {
        venta.setUsuario(usuario);
        venta.setFecha(LocalDateTime.now());

        BigDecimal totalVenta = BigDecimal.ZERO;

        // Guardar la venta vacía para tener ID
        List<DetalleVenta> detalles = venta.getDetalles();
        venta.setDetalles(null);
        Venta ventaGuardada = ventaRepository.save(venta);

        for (DetalleVenta detalle : detalles) {
            Producto producto = productoRepository.findById(detalle.getProducto().getId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + detalle.getProducto().getId()));

            // Validar stock
            if (producto.getStock().compareTo(detalle.getCantidad()) < 0) {
                throw new RuntimeException("Stock insuficiente para el producto: " + producto.getNombre() 
                    + " (Stock actual: " + producto.getStock() + ")");
            }

            // Usar precio de venta actual del producto si no viene en el detalle
            BigDecimal precioUnitario = detalle.getPrecioUnitario() != null ? detalle.getPrecioUnitario() : producto.getPrecioVenta();
            BigDecimal subtotal = detalle.getCantidad().multiply(precioUnitario);

            detalle.setPrecioUnitario(precioUnitario);
            detalle.setSubtotal(subtotal);
            detalle.setVenta(ventaGuardada);
            detalle.setProducto(producto);

            totalVenta = totalVenta.add(subtotal);

            // Actualizar stock e inventario
            inventarioService.registrarMovimiento(
                    producto.getId(),
                    "Salida",
                    detalle.getCantidad(),
                    "Venta registrada ID: " + ventaGuardada.getId(),
                    usuario
            );
        }

        // Calcular IGV y Subtotal partiendo del Total
        // Total = Subtotal + IGV
        // Subtotal = Total / 1.18
        // IGV = Total - Subtotal
        BigDecimal subtotalGeneral = totalVenta.divide(BigDecimal.ONE.add(IGV_RATE), 2, RoundingMode.HALF_UP);
        BigDecimal igvGeneral = totalVenta.subtract(subtotalGeneral);

        ventaGuardada.setTotal(totalVenta);
        ventaGuardada.setSubtotal(subtotalGeneral);
        ventaGuardada.setIgv(igvGeneral);
        ventaGuardada.setDetalles(detalles);

        return ventaRepository.save(ventaGuardada);
    }

    public List<Venta> obtenerTodas() {
        return ventaRepository.findAllOrderByFechaDesc();
    }

    public Venta obtenerPorId(UUID id) {
        return ventaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));
    }

    public List<Venta> obtenerUltimasVentas() {
        return ventaRepository.findTop10ByOrderByFechaDesc();
    }

    public List<Venta> obtenerPorRangoFecha(LocalDateTime start, LocalDateTime end) {
        return ventaRepository.findSalesBetween(start, end);
    }

    @Transactional
    public Venta anularVenta(UUID id, String motivo, Usuario usuario) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada: " + id));
        if (Boolean.TRUE.equals(venta.getAnulada())) {
            throw new RuntimeException("La venta ya fue anulada anteriormente.");
        }
        venta.setAnulada(true);
        venta.setMotivoAnulacion(motivo);
        // Revertir stock por cada detalle
        if (venta.getDetalles() != null) {
            for (DetalleVenta d : venta.getDetalles()) {
                inventarioService.registrarMovimiento(
                        d.getProducto().getId(),
                        "Entrada",
                        d.getCantidad(),
                        "Anulación de venta ID: " + id + " - Motivo: " + motivo,
                        usuario
                );
            }
        }
        return ventaRepository.save(venta);
    }
}
