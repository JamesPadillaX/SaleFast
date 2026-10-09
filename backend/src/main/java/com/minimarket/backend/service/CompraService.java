package com.minimarket.backend.service;

import com.minimarket.backend.model.*;
import com.minimarket.backend.repository.CompraRepository;
import com.minimarket.backend.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class CompraService {

    @Autowired
    private CompraRepository compraRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private InventarioService inventarioService;

    @Transactional
    public Compra registrarCompra(Compra compra, Usuario usuario) {
        compra.setUsuario(usuario);
        compra.setFecha(LocalDateTime.now());
        
        BigDecimal totalCompra = BigDecimal.ZERO;
        
        // Primero guardamos la compra vacía para tener ID
        List<DetalleCompra> detalles = compra.getDetalles();
        compra.setDetalles(null);
        Compra compraGuardada = compraRepository.save(compra);
        
        for (DetalleCompra detalle : detalles) {
            Producto producto = productoRepository.findById(detalle.getProducto().getId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + detalle.getProducto().getId()));
            
            // Calcular subtotal del detalle
            BigDecimal subtotal = detalle.getCantidad().multiply(detalle.getPrecioUnitario());
            detalle.setSubtotal(subtotal);
            detalle.setCompra(compraGuardada);
            detalle.setProducto(producto);
            
            totalCompra = totalCompra.add(subtotal);
            
            // Actualizar stock del producto e inventario
            inventarioService.registrarMovimiento(
                    producto.getId(),
                    "Entrada",
                    detalle.getCantidad(),
                    "Compra registrada ID: " + compraGuardada.getId(),
                    usuario
            );
        }
        
        compraGuardada.setTotal(totalCompra);
        compraGuardada.setDetalles(detalles);
        return compraRepository.save(compraGuardada);
    }

    public List<Compra> obtenerTodas() {
        return compraRepository.findAll();
    }

    public Compra obtenerPorId(UUID id) {
        return compraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Compra no encontrada"));
    }
}
