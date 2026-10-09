import 'dart:convert';
import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class InventoryProvider extends ChangeNotifier {
  List<Producto> _productos = [];
  List<Categoria> _categorias = [];
  List<Cliente> _clientes = [];
  List<Proveedor> _proveedores = [];
  List<Producto> _bajoStock = [];
  List<MovimientoInventario> _movimientos = [];
  bool _isLoading = false;

  List<Producto> get productos => _productos;
  List<Categoria> get categorias => _categorias;
  List<Cliente> get clientes => _clientes;
  List<Proveedor> get proveedores => _proveedores;
  List<Producto> get bajoStock => _bajoStock;
  List<MovimientoInventario> get movimientos => _movimientos;
  bool get isLoading => _isLoading;

  Future<void> cargarTodo() async {
    _isLoading = true;
    notifyListeners();
    await Future.wait([
      cargarProductos(),
      cargarCategorias(),
      cargarClientes(),
      cargarProveedores(),
      cargarBajoStock(),
      cargarHistorialMovimientos(),
    ]);
    _isLoading = false;
    notifyListeners();
  }

  Future<void> cargarProductos({String? query}) async {
    try {
      final endpoint = query != null && query.isNotEmpty ? '/productos?query=$query' : '/productos';
      final response = await ApiService.get(endpoint);
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final list = data['content'] as List? ?? [];
        _productos = list.map((item) => Producto.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error al cargar productos: $e');
    }
    notifyListeners();
  }

  Future<void> cargarCategorias() async {
    try {
      final response = await ApiService.get('/categorias');
      if (response.statusCode == 200) {
        final List list = json.decode(response.body);
        _categorias = list.map((item) => Categoria.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error al cargar categorias: $e');
    }
  }

  Future<void> cargarClientes() async {
    try {
      final response = await ApiService.get('/clientes');
      if (response.statusCode == 200) {
        final List list = json.decode(response.body);
        _clientes = list.map((item) => Cliente.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error al cargar clientes: $e');
    }
  }

  Future<void> cargarProveedores() async {
    try {
      final response = await ApiService.get('/proveedores');
      if (response.statusCode == 200) {
        final List list = json.decode(response.body);
        _proveedores = list.map((item) => Proveedor.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error al cargar proveedores: $e');
    }
  }

  Future<void> cargarBajoStock() async {
    try {
      final response = await ApiService.get('/productos/bajo-stock');
      if (response.statusCode == 200) {
        final List list = json.decode(response.body);
        _bajoStock = list.map((item) => Producto.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error al cargar productos de bajo stock: $e');
    }
  }

  Future<void> cargarHistorialMovimientos() async {
    try {
      final response = await ApiService.get('/inventario/historial');
      if (response.statusCode == 200) {
        final List list = json.decode(response.body);
        _movimientos = list.map((item) => MovimientoInventario.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error al cargar historial de movimientos: $e');
    }
  }

  Future<bool> registrarMovimientoManual(int productoId, String tipo, double cantidad, String motivo) async {
    try {
      final response = await ApiService.post('/inventario/movimiento', {
        'productoId': productoId,
        'tipo': tipo,
        'cantidad': cantidad,
        'motivo': motivo,
      });
      if (response.statusCode == 200) {
        await cargarProductos();
        await cargarBajoStock();
        await cargarHistorialMovimientos();
        return true;
      }
    } catch (e) {
      debugPrint('Error al registrar movimiento de inventario: $e');
    }
    return false;
  }

  Future<bool> registrarCompra(Compra compra) async {
    try {
      final response = await ApiService.post('/compras', compra.toJson());
      if (response.statusCode == 200) {
        await cargarProductos();
        await cargarBajoStock();
        await cargarHistorialMovimientos();
        return true;
      }
    } catch (e) {
      debugPrint('Error al registrar compra: $e');
    }
    return false;
  }

  Future<bool> guardarProducto(Producto producto) async {
    try {
      final response = await ApiService.post('/productos', {
        'codigoBarras': producto.codigoBarras,
        'nombre': producto.nombre,
        'categoria': {'id': producto.categoria.id},
        'descripcion': producto.descripcion,
        'precioCompra': producto.precioCompra,
        'precioVenta': producto.precioVenta,
        'stockMinimo': producto.stockMinimo,
        'unidadMedida': producto.unidadMedida,
        'imagenUrl': producto.imagenUrl,
      });
      if (response.statusCode == 200) {
        await cargarProductos();
        return true;
      }
    } catch (e) {
      debugPrint('Error al registrar producto: $e');
    }
    return false;
  }

  Future<bool> actualizarProducto(int id, Producto producto) async {
    try {
      final response = await ApiService.put('/productos/$id', {
        'codigoBarras': producto.codigoBarras,
        'nombre': producto.nombre,
        'categoria': {'id': producto.categoria.id},
        'descripcion': producto.descripcion,
        'precioCompra': producto.precioCompra,
        'precioVenta': producto.precioVenta,
        'stockMinimo': producto.stockMinimo,
        'unidadMedida': producto.unidadMedida,
        'imagenUrl': producto.imagenUrl,
      });
      if (response.statusCode == 200) {
        await cargarProductos();
        return true;
      }
    } catch (e) {
      debugPrint('Error al actualizar producto: $e');
    }
    return false;
  }

  Future<bool> eliminarProducto(int id) async {
    try {
      final response = await ApiService.delete('/productos/$id');
      if (response.statusCode == 204) {
        await cargarProductos();
        return true;
      }
    } catch (e) {
      debugPrint('Error al eliminar producto: $e');
    }
    return false;
  }

  Future<bool> guardarCliente(Cliente cliente) async {
    try {
      final response = await ApiService.post('/clientes', cliente.toJson());
      if (response.statusCode == 200) {
        await cargarClientes();
        return true;
      }
    } catch (e) {
      debugPrint('Error al registrar cliente: $e');
    }
    return false;
  }

  Future<bool> guardarProveedor(Proveedor proveedor) async {
    try {
      final response = await ApiService.post('/proveedores', proveedor.toJson());
      if (response.statusCode == 200) {
        await cargarProveedores();
        return true;
      }
    } catch (e) {
      debugPrint('Error al registrar proveedor: $e');
    }
    return false;
  }
}
