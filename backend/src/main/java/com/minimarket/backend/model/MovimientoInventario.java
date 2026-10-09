package com.minimarket.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "movimientos_inventario")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MovimientoInventario {
    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "UUID")
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_id", nullable = false)
    @JsonIgnoreProperties({"movimientos", "fechaCreacion"})
    private Producto producto;

    @Column(nullable = false, length = 10)
    private String tipo; // 'Entrada', 'Salida', 'Ajuste'

    @Column(nullable = false)
    private BigDecimal cantidad;

    @Column(nullable = false)
    private String motivo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_id", nullable = false)
    @JsonIgnoreProperties({"password", "fechaCreacion", "activo"})
    private Usuario usuario;

    private LocalDateTime fecha = LocalDateTime.now();
}

