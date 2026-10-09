package com.minimarket.backend.service;

import com.minimarket.backend.model.Producto;
import com.minimarket.backend.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    public Page<Producto> obtenerTodos(Pageable pageable) {
        return productoRepository.findByActivoTrue(pageable);
    }

    public Page<Producto> buscarYFiltrar(String query, Pageable pageable) {
        if (query == null || query.trim().isEmpty()) {
            return obtenerTodos(pageable);
        }
        return productoRepository.searchProducts(query, pageable);
    }

    public Page<Producto> filtrarPorCategoria(UUID categoriaId, Pageable pageable) {
        return productoRepository.findByCategoriaIdAndActivoTrue(categoriaId, pageable);
    }

    public Producto obtenerPorId(UUID id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
    }

    public Producto obtenerPorCodigoBarras(String codigo) {
        return productoRepository.findByCodigoBarrasAndActivoTrue(codigo)
                .orElseThrow(() -> new RuntimeException("Producto con código de barras no encontrado"));
    }

    @Transactional
    public Producto guardar(Producto producto) {
        producto.setFechaCreacion(LocalDateTime.now());
        producto.setActivo(true);
        return productoRepository.save(producto);
    }

    @Transactional
    public Producto actualizar(UUID id, Producto productoDetalles) {
        Producto producto = obtenerPorId(id);
        producto.setNombre(productoDetalles.getNombre());
        producto.setCodigoBarras(productoDetalles.getCodigoBarras());
        producto.setCategoria(productoDetalles.getCategoria());
        producto.setDescripcion(productoDetalles.getDescripcion());
        producto.setPrecioCompra(productoDetalles.getPrecioCompra());
        producto.setPrecioVenta(productoDetalles.getPrecioVenta());
        producto.setStockMinimo(productoDetalles.getStockMinimo());
        producto.setUnidadMedida(productoDetalles.getUnidadMedida());
        producto.setImagenUrl(productoDetalles.getImagenUrl());
        return productoRepository.save(producto);
    }

    @Transactional
    public void eliminar(UUID id) {
        Producto producto = obtenerPorId(id);
        producto.setActivo(false); // Eliminado lógico
        productoRepository.save(producto);
    }

    public List<Producto> obtenerBajoStock() {
        return productoRepository.findLowStockProducts();
    }
}
