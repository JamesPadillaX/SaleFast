package com.minimarket.backend.controller;

import com.minimarket.backend.model.MovimientoInventario;
import com.minimarket.backend.model.Usuario;
import com.minimarket.backend.service.AuthService;
import com.minimarket.backend.service.InventarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/inventario")
public class InventarioController {

    @Autowired
    private InventarioService inventarioService;

    @Autowired
    private AuthService authService;

    @PostMapping("/movimiento")
    public ResponseEntity<MovimientoInventario> registrarMovimiento(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        UUID productoId = UUID.fromString(request.get("productoId").toString());
        String tipo = (String) request.get("tipo");
        BigDecimal cantidad = new BigDecimal(request.get("cantidad").toString());
        String motivo = (String) request.get("motivo");
        
        String username = authentication.getName();
        Usuario usuario = authService.findByUsername(username);
        
        return ResponseEntity.ok(inventarioService.registrarMovimiento(productoId, tipo, cantidad, motivo, usuario));
    }

    @GetMapping("/historial")
    public ResponseEntity<List<MovimientoInventario>> obtenerHistorial() {
        return ResponseEntity.ok(inventarioService.obtenerHistorial());
    }

    @GetMapping("/historial/producto/{productoId}")
    public ResponseEntity<List<MovimientoInventario>> obtenerHistorialPorProducto(@PathVariable UUID productoId) {
        return ResponseEntity.ok(inventarioService.obtenerHistorialPorProducto(productoId));
    }
}
