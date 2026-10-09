package com.minimarket.backend.controller;

import com.minimarket.backend.model.Producto;
import com.minimarket.backend.service.ProductoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {

    @Autowired
    private ProductoService productoService;

    @GetMapping
    public ResponseEntity<Page<Producto>> listar(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nombre").ascending());
        if (query != null && !query.trim().isEmpty()) {
            return ResponseEntity.ok(productoService.buscarYFiltrar(query, pageable));
        }
        return ResponseEntity.ok(productoService.obtenerTodos(pageable));
    }

    @GetMapping("/categoria/{categoriaId}")
    public ResponseEntity<Page<Producto>> listarPorCategoria(
            @PathVariable UUID categoriaId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nombre").ascending());
        return ResponseEntity.ok(productoService.filtrarPorCategoria(categoriaId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Producto> obtenerPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(productoService.obtenerPorId(id));
    }

    @GetMapping("/codigo/{codigo}")
    public ResponseEntity<Producto> obtenerPorCodigoBarras(@PathVariable String codigo) {
        return ResponseEntity.ok(productoService.obtenerPorCodigoBarras(codigo));
    }

    @GetMapping("/bajo-stock")
    public ResponseEntity<List<Producto>> obtenerBajoStock() {
        return ResponseEntity.ok(productoService.obtenerBajoStock());
    }

    @PostMapping
    public ResponseEntity<Producto> guardar(@RequestBody Producto producto) {
        return ResponseEntity.ok(productoService.guardar(producto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Producto> actualizar(@PathVariable UUID id, @RequestBody Producto producto) {
        return ResponseEntity.ok(productoService.actualizar(id, producto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable UUID id) {
        productoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
