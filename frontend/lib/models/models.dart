// Definición de Modelos de Datos para el frontend

class Categoria {
  final int? id;
  final String nombre;
  final String? descripcion;

  Categoria({this.id, required this.nombre, this.descripcion});

  factory Categoria.fromJson(Map<String, dynamic> json) {
    return Categoria(
      id: json['id'],
      nombre: json['nombre'],
      descripcion: json['descripcion'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'nombre': nombre,
      'descripcion': descripcion,
    };
  }
}

class Producto {
  final int? id;
  final String codigoBarras;
  final String nombre;
  final Categoria categoria;
  final String? descripcion;
  final double precioCompra;
  final double precioVenta;
  final double stock;
  final double stockMinimo;
  final String unidadMedida; // 'unidad', 'kilogramo', 'litro', 'paquete', 'caja'
  final String? imagenUrl;
  final bool activo;

  Producto({
    this.id,
    required this.codigoBarras,
    required this.nombre,
    required this.categoria,
    this.descripcion,
    required this.precioCompra,
    required this.precioVenta,
    required this.stock,
    required this.stockMinimo,
    required this.unidadMedida,
    this.imagenUrl,
    this.activo = true,
  });

  factory Producto.fromJson(Map<String, dynamic> json) {
    return Producto(
      id: json['id'],
      codigoBarras: json['codigoBarras'] ?? json['codigo_barras'] ?? '',
      nombre: json['nombre'] ?? '',
      categoria: Categoria.fromJson(json['categoria']),
      descripcion: json['descripcion'],
      precioCompra: (json['precioCompra'] ?? json['precio_compra'] ?? 0.0).toDouble(),
      precioVenta: (json['precioVenta'] ?? json['precio_venta'] ?? 0.0).toDouble(),
      stock: (json['stock'] ?? 0.0).toDouble(),
      stockMinimo: (json['stockMinimo'] ?? json['stock_minimo'] ?? 0.0).toDouble(),
      unidadMedida: json['unidadMedida'] ?? json['unidad_medida'] ?? 'unidad',
      imagenUrl: json['imagenUrl'] ?? json['imagen_url'],
      activo: json['activo'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'codigoBarras': codigoBarras,
      'nombre': nombre,
      'categoria': categoria.toJson(),
      'descripcion': descripcion,
      'precioCompra': precioCompra,
      'precioVenta': precioVenta,
      'stock': stock,
      'stockMinimo': stockMinimo,
      'unidadMedida': unidadMedida,
      'imagenUrl': imagenUrl,
      'activo': activo,
    };
  }
}

class Cliente {
  final int? id;
  final String nombre;
  final String dni;
  final String? telefono;

  Cliente({this.id, required this.nombre, required this.dni, this.telefono});

  factory Cliente.fromJson(Map<String, dynamic> json) {
    return Cliente(
      id: json['id'],
      nombre: json['nombre'] ?? '',
      dni: json['dni'] ?? '',
      telefono: json['telefono'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'nombre': nombre,
      'dni': dni,
      'telefono': telefono,
    };
  }
}

class Proveedor {
  final int? id;
  final String nombre;
  final String ruc;
  final String? telefono;
  final String? direccion;
  final String? correo;

  Proveedor({
    this.id,
    required this.nombre,
    required this.ruc,
    this.telefono,
    this.direccion,
    this.correo,
  });

  factory Proveedor.fromJson(Map<String, dynamic> json) {
    return Proveedor(
      id: json['id'],
      nombre: json['nombre'] ?? '',
      ruc: json['ruc'] ?? '',
      telefono: json['telefono'],
      direccion: json['direccion'],
      correo: json['correo'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'nombre': nombre,
      'ruc': ruc,
      'telefono': telefono,
      'direccion': direccion,
      'correo': correo,
    };
  }
}

class DetalleVenta {
  final int? id;
  final Producto producto;
  final double cantidad;
  final double precioUnitario;
  final double subtotal;

  DetalleVenta({
    this.id,
    required this.producto,
    required this.cantidad,
    required this.precioUnitario,
    required this.subtotal,
  });

  factory DetalleVenta.fromJson(Map<String, dynamic> json) {
    return DetalleVenta(
      id: json['id'],
      producto: Producto.fromJson(json['producto']),
      cantidad: (json['cantidad'] ?? 0.0).toDouble(),
      precioUnitario: (json['precioUnitario'] ?? json['precio_unitario'] ?? 0.0).toDouble(),
      subtotal: (json['subtotal'] ?? 0.0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'producto': {'id': producto.id},
      'cantidad': cantidad,
      'precioUnitario': precioUnitario,
      'subtotal': subtotal,
    };
  }
}

class Venta {
  final int? id;
  final Cliente? cliente;
  final DateTime? fecha;
  final double subtotal;
  final double igv;
  final double total;
  final String metodoPago; // 'Efectivo', 'Tarjeta', 'Yape', 'Plin'
  final List<DetalleVenta> detalles;

  Venta({
    this.id,
    this.cliente,
    this.fecha,
    required this.subtotal,
    required this.igv,
    required this.total,
    required this.metodoPago,
    required this.detalles,
  });

  factory Venta.fromJson(Map<String, dynamic> json) {
    var list = json['detalles'] as List? ?? [];
    List<DetalleVenta> detList = list.map((i) => DetalleVenta.fromJson(i)).toList();
    
    return Venta(
      id: json['id'],
      cliente: json['cliente'] != null ? Cliente.fromJson(json['cliente']) : null,
      fecha: json['fecha'] != null ? DateTime.parse(json['fecha']) : null,
      subtotal: (json['subtotal'] ?? 0.0).toDouble(),
      igv: (json['igv'] ?? 0.0).toDouble(),
      total: (json['total'] ?? 0.0).toDouble(),
      metodoPago: json['metodoPago'] ?? json['metodo_pago'] ?? 'Efectivo',
      detalles: detList,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (cliente != null) 'cliente': {'id': cliente!.id},
      'subtotal': subtotal,
      'igv': igv,
      'total': total,
      'metodoPago': metodoPago,
      'detalles': detalles.map((d) => d.toJson()).toList(),
    };
  }
}

class DetalleCompra {
  final int? id;
  final Producto producto;
  final double cantidad;
  final double precioUnitario;
  final double subtotal;

  DetalleCompra({
    this.id,
    required this.producto,
    required this.cantidad,
    required this.precioUnitario,
    required this.subtotal,
  });

  factory DetalleCompra.fromJson(Map<String, dynamic> json) {
    return DetalleCompra(
      id: json['id'],
      producto: Producto.fromJson(json['producto']),
      cantidad: (json['cantidad'] ?? 0.0).toDouble(),
      precioUnitario: (json['precioUnitario'] ?? json['precio_unitario'] ?? 0.0).toDouble(),
      subtotal: (json['subtotal'] ?? 0.0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'producto': {'id': producto.id},
      'cantidad': cantidad,
      'precioUnitario': precioUnitario,
      'subtotal': subtotal,
    };
  }
}

class Compra {
  final int? id;
  final Proveedor proveedor;
  final DateTime? fecha;
  final double total;
  final List<DetalleCompra> detalles;

  Compra({
    this.id,
    required this.proveedor,
    this.fecha,
    required this.total,
    required this.detalles,
  });

  factory Compra.fromJson(Map<String, dynamic> json) {
    var list = json['detalles'] as List? ?? [];
    List<DetalleCompra> detList = list.map((i) => DetalleCompra.fromJson(i)).toList();

    return Compra(
      id: json['id'],
      proveedor: Proveedor.fromJson(json['proveedor']),
      fecha: json['fecha'] != null ? DateTime.parse(json['fecha']) : null,
      total: (json['total'] ?? 0.0).toDouble(),
      detalles: detList,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'proveedor': {'id': proveedor.id},
      'total': total,
      'detalles': detalles.map((d) => d.toJson()).toList(),
    };
  }
}

class MovimientoInventario {
  final int? id;
  final Producto producto;
  final String tipo; // 'Entrada', 'Salida', 'Ajuste'
  final double cantidad;
  final String motivo;
  final String nombreUsuario;
  final DateTime fecha;

  MovimientoInventario({
    this.id,
    required this.producto,
    required this.tipo,
    required this.cantidad,
    required this.motivo,
    required this.nombreUsuario,
    required this.fecha,
  });

  factory MovimientoInventario.fromJson(Map<String, dynamic> json) {
    return MovimientoInventario(
      id: json['id'],
      producto: Producto.fromJson(json['producto']),
      tipo: json['tipo'] ?? '',
      cantidad: (json['cantidad'] ?? 0.0).toDouble(),
      motivo: json['motivo'] ?? '',
      nombreUsuario: json['usuario'] != null ? (json['usuario']['nombre'] ?? '') : '',
      fecha: DateTime.parse(json['fecha'] ?? DateTime.now().toIso8601String()),
    );
  }
}
