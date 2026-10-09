package com.minimarket.backend.controller;

import com.minimarket.backend.model.Usuario;
import com.minimarket.backend.model.Venta;
import com.minimarket.backend.service.AuthService;
import com.minimarket.backend.service.VentaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/ventas")
public class VentaController {

    @Autowired
    private VentaService ventaService;

    @Autowired
    private AuthService authService;

    @PostMapping
    public ResponseEntity<Venta> registrar(@RequestBody Venta venta, Authentication authentication) {
        String username = authentication.getName();
        Usuario usuario = authService.findByUsername(username);
        return ResponseEntity.ok(ventaService.registrarVenta(venta, usuario));
    }

    @GetMapping
    public ResponseEntity<List<Venta>> listarTodas() {
        return ResponseEntity.ok(ventaService.obtenerTodas());
    }

    @GetMapping("/ultimas")
    public ResponseEntity<List<Venta>> obtenerUltimas() {
        return ResponseEntity.ok(ventaService.obtenerUltimasVentas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Venta> obtenerPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(ventaService.obtenerPorId(id));
    }

    @GetMapping("/rango")
    public ResponseEntity<List<Venta>> obtenerPorRango(
            @RequestParam String inicio,
            @RequestParam String fin) {
        LocalDateTime start = LocalDateTime.parse(inicio);
        LocalDateTime end = LocalDateTime.parse(fin);
        return ResponseEntity.ok(ventaService.obtenerPorRangoFecha(start, end));
    }

    @PatchMapping("/{id}/anular")
    public ResponseEntity<?> anularVenta(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            Usuario usuario = authService.findByUsername(username);
            String motivo = body.getOrDefault("motivo", "Sin motivo especificado");
            Venta ventaAnulada = ventaService.anularVenta(id, motivo, usuario);
            return ResponseEntity.ok(ventaAnulada);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
