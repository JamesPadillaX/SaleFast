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
@Table(name = "productos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Producto {
    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "UUID")
    private UUID id;

    @Column(name = "codigo_barras", nullable = false, unique = true, length = 100)
    private String codigoBarras;

    @Column(nullable = false, length = 150)
    private String nombre;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    private String descripcion;

    @Column(name = "precio_compra", nullable = false)
    private BigDecimal precioCompra;

    @Column(name = "precio_venta", nullable = false)
    private BigDecimal precioVenta;

    @Column(nullable = false)
    private BigDecimal stock = BigDecimal.ZERO;

    @Column(name = "stock_minimo", nullable = false)
    private BigDecimal stockMinimo = BigDecimal.ZERO;

    @Column(name = "unidad_medida", nullable = false, length = 20)
    private String unidadMedida; // 'unidad', 'kilogramo', 'litro', 'paquete', 'caja'

    @Column(name = "imagen_url")
    private String imagenUrl;

    private Boolean activo = true;

    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();
}

