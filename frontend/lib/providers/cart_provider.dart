import 'dart:convert';
import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class CartItem {
  final Producto producto;
  double cantidad;

  CartItem({required this.producto, this.cantidad = 1.0});

  double get subtotal => producto.precioVenta * cantidad;
}

class CartProvider extends ChangeNotifier {
  final List<CartItem> _items = [];
  Cliente? _clienteSeleccionado;
  String _metodoPago = 'Efectivo'; // 'Efectivo', 'Tarjeta', 'Yape', 'Plin'
  bool _isSaving = false;
  String? _errorMessage;

  List<CartItem> get items => _items;
  Cliente? get clienteSeleccionado => _clienteSeleccionado;
  String get metodoPago => _metodoPago;
  bool get isSaving => _isSaving;
  String? get errorMessage => _errorMessage;

  double get total => _items.fold(0.0, (sum, item) => sum + item.subtotal);
  double get subtotal => total / 1.18;
  double get igv => total - subtotal;

  void agregarProducto(Producto producto, {double cantidad = 1.0}) {
    final index = _items.indexWhere((item) => item.producto.id == producto.id);
    if (index >= 0) {
      _items[index].cantidad += cantidad;
    } else {
      _items.add(CartItem(producto: producto, cantidad: cantidad));
    }
    notifyListeners();
  }

  void actualizarCantidad(int productoId, double cantidad) {
    final index = _items.indexWhere((item) => item.producto.id == productoId);
    if (index >= 0) {
      if (cantidad <= 0) {
        _items.removeAt(index);
      } else {
        _items[index].cantidad = cantidad;
      }
      notifyListeners();
    }
  }

  void eliminarItem(int productoId) {
    _items.removeWhere((item) => item.producto.id == productoId);
    notifyListeners();
  }

  void seleccionarCliente(Cliente? cliente) {
    _clienteSeleccionado = cliente;
    notifyListeners();
  }

  void setMetodoPago(String metodo) {
    _metodoPago = metodo;
    notifyListeners();
  }

  void limpiar() {
    _items.clear();
    _clienteSeleccionado = null;
    _metodoPago = 'Efectivo';
    _errorMessage = null;
    notifyListeners();
  }

  Future<bool> registrarVenta() async {
    if (_items.isEmpty) {
      _errorMessage = 'El carrito está vacío';
      notifyListeners();
      return false;
    }

    _isSaving = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final List<Map<String, dynamic>> detallesJson = _items.map((item) {
        return {
          'producto': {'id': item.producto.id},
          'cantidad': item.cantidad,
          'precioUnitario': item.producto.precioVenta,
          'subtotal': item.subtotal,
        };
      }).toList();

      final Map<String, dynamic> ventaJson = {
        if (_clienteSeleccionado != null) 'cliente': {'id': _clienteSeleccionado!.id},
        'subtotal': subtotal,
        'igv': igv,
        'total': total,
        'metodoPago': _metodoPago,
        'detalles': detallesJson,
      };

      final response = await ApiService.post('/ventas', ventaJson);

      if (response.statusCode == 200) {
        limpiar();
        _isSaving = false;
        notifyListeners();
        return true;
      } else {
        final data = json.decode(response.body);
        _errorMessage = data['message'] ?? 'Error al procesar la venta';
      }
    } catch (e) {
      _errorMessage = 'Error de conexión con el servidor';
    }

    _isSaving = false;
    notifyListeners();
    return false;
  }
}
