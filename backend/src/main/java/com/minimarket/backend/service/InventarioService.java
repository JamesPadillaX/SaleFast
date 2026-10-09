package com.minimarket.backend.service;

import com.minimarket.backend.model.MovimientoInventario;
import com.minimarket.backend.model.Producto;
import com.minimarket.backend.model.Usuario;
import com.minimarket.backend.repository.MovimientoInventarioRepository;
import com.minimarket.backend.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class InventarioService {

    @Autowired
    private MovimientoInventarioRepository movimientoRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Transactional
    public MovimientoInventario registrarMovimiento(UUID productoId, String tipo, BigDecimal cantidad, String motivo, Usuario usuario) {
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        String tipoNormalizado;
        BigDecimal nuevoStock = producto.getStock();
        if (tipo.equalsIgnoreCase("Entrada")) {
            tipoNormalizado = "Entrada";
            nuevoStock = nuevoStock.add(cantidad);
        } else if (tipo.equalsIgnoreCase("Salida")) {
            tipoNormalizado = "Salida";
            if (nuevoStock.compareTo(cantidad) < 0) {
                throw new RuntimeException("Stock insuficiente para realizar la salida");
            }
            nuevoStock = nuevoStock.subtract(cantidad);
        } else if (tipo.equalsIgnoreCase("Ajuste")) {
            tipoNormalizado = "Ajuste";
            nuevoStock = cantidad; // Ajuste redefine el stock directo
        } else {
            throw new IllegalArgumentException("Tipo de movimiento no válido: " + tipo);
        }

        producto.setStock(nuevoStock);
        productoRepository.save(producto);

        MovimientoInventario movimiento = new MovimientoInventario();
        movimiento.setProducto(producto);
        movimiento.setTipo(tipoNormalizado);
        movimiento.setCantidad(cantidad);
        movimiento.setMotivo(motivo);
        movimiento.setUsuario(usuario);
        movimiento.setFecha(LocalDateTime.now());

        return movimientoRepository.save(movimiento);
    }

    public List<MovimientoInventario> obtenerHistorial() {
        return movimientoRepository.findTop50ByOrderByFechaDesc();
    }

    public List<MovimientoInventario> obtenerHistorialPorProducto(UUID productoId) {
        return movimientoRepository.findByProductoIdOrderByFechaDesc(productoId);
    }
}
