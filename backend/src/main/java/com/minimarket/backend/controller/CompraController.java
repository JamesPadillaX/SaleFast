package com.minimarket.backend.controller;

import com.minimarket.backend.model.Compra;
import com.minimarket.backend.model.Usuario;
import com.minimarket.backend.service.AuthService;
import com.minimarket.backend.service.CompraService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/compras")
public class CompraController {

    @Autowired
    private CompraService compraService;

    @Autowired
    private AuthService authService;

    @PostMapping
    public ResponseEntity<Compra> registrar(@RequestBody Compra compra, Authentication authentication) {
        String username = authentication.getName();
        Usuario usuario = authService.findByUsername(username);
        return ResponseEntity.ok(compraService.registrarCompra(compra, usuario));
    }

    @GetMapping
    public ResponseEntity<List<Compra>> listarTodas() {
        return ResponseEntity.ok(compraService.obtenerTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Compra> obtenerPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(compraService.obtenerPorId(id));
    }
}
