package com.minimarket.backend.controller;

import com.minimarket.backend.model.Proveedor;
import com.minimarket.backend.service.ProveedorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/proveedores")
public class ProveedorController {

    @Autowired
    private ProveedorService proveedorService;

    @GetMapping
    public ResponseEntity<List<Proveedor>> listarTodos() {
        return ResponseEntity.ok(proveedorService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Proveedor> obtenerPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(proveedorService.obtenerPorId(id));
    }

    @GetMapping("/ruc/{ruc}")
    public ResponseEntity<Proveedor> obtenerPorRuc(@PathVariable String ruc) {
        return ResponseEntity.ok(proveedorService.obtenerPorRuc(ruc));
    }

    @PostMapping
    public ResponseEntity<Proveedor> guardar(@RequestBody Proveedor proveedor) {
        return ResponseEntity.ok(proveedorService.guardar(proveedor));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Proveedor> actualizar(@PathVariable UUID id, @RequestBody Proveedor proveedor) {
        return ResponseEntity.ok(proveedorService.actualizar(id, proveedor));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable UUID id) {
        proveedorService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
