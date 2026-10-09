package com.minimarket.backend.controller;

import com.minimarket.backend.service.ReporteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/reportes")
public class ReporteController {

    @Autowired
    private ReporteService reporteService;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> obtenerDashboard() {
        return ResponseEntity.ok(reporteService.obtenerDashboard());
    }

    @GetMapping("/completo")
    public ResponseEntity<Map<String, Object>> obtenerReporteCompleto() {
        return ResponseEntity.ok(reporteService.generarReporteCompleto());
    }
}
