import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/auth_provider.dart';
import '../providers/inventory_provider.dart';
import '../models/models.dart';

class ProductsScreen extends StatefulWidget {
  const ProductsScreen({super.key});

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  final _searchController = TextEditingController();
  final _codigoController = TextEditingController();
  final _nombreController = TextEditingController();
  final _descripcionController = TextEditingController();
  final _precioCompraController = TextEditingController();
  final _precioVentaController = TextEditingController();
  final _stockMinimoController = TextEditingController();
  
  Categoria? _categoriaSeleccionada;
  String _unidadMedida = 'unidad'; // 'unidad', 'kilogramo', 'litro', 'paquete', 'caja'
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    _codigoController.dispose();
    _nombreController.dispose();
    _descripcionController.dispose();
    _precioCompraController.dispose();
    _precioVentaController.dispose();
    _stockMinimoController.dispose();
    super.dispose();
  }

  void _limpiarFormulario() {
    _codigoController.clear();
    _nombreController.clear();
    _descripcionController.clear();
    _precioCompraController.clear();
    _precioVentaController.clear();
    _stockMinimoController.clear();
    _unidadMedida = 'unidad';
    _categoriaSeleccionada = null;
  }

  void _abrirDialogoProducto(BuildContext context, {Producto? producto}) {
    final inv = Provider.of<InventoryProvider>(context, listen: false);
    
    if (producto != null) {
      _codigoController.text = producto.codigoBarras;
      _nombreController.text = producto.nombre;
      _descripcionController.text = producto.descripcion ?? '';
      _precioCompraController.text = '${producto.precioCompra}';
      _precioVentaController.text = '${producto.precioVenta}';
      _stockMinimoController.text = '${producto.stockMinimo}';
      _unidadMedida = producto.unidadMedida;
      _categoriaSeleccionada = inv.categorias.firstWhere((c) => c.id == producto.categoria.id);
    } else {
      _limpiarFormulario();
      if (inv.categorias.isNotEmpty) {
        _categoriaSeleccionada = inv.categorias.first;
      }
    }

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: Text(producto == null ? 'Nuevo Producto' : 'Editar Producto'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: _codigoController,
                      decoration: const InputDecoration(labelText: 'Código de Barras'),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _nombreController,
                      decoration: const InputDecoration(labelText: 'Nombre'),
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<Categoria>(
                      value: _categoriaSeleccionada,
                      decoration: const InputDecoration(labelText: 'Categoría'),
                      items: inv.categorias.map((c) {
                        return DropdownMenuItem(value: c, child: Text(c.nombre));
                      }).toList(),
                      onChanged: (val) {
                        setState(() {
                          _categoriaSeleccionada = val;
                        });
                      },
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _descripcionController,
                      decoration: const InputDecoration(labelText: 'Descripción'),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _precioCompraController,
                            decoration: const InputDecoration(labelText: 'P. Compra'),
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: _precioVentaController,
                            decoration: const InputDecoration(labelText: 'P. Venta'),
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _stockMinimoController,
                            decoration: const InputDecoration(labelText: 'Stock Mín.'),
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _unidadMedida,
                            decoration: const InputDecoration(labelText: 'U. Medida'),
                            items: ['unidad', 'kilogramo', 'litro', 'paquete', 'caja'].map((u) {
                              return DropdownMenuItem(value: u, child: Text(u));
                            }).toList(),
                            onChanged: (val) {
                              setState(() {
                                _unidadMedida = val!;
                              });
                            },
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    _limpiarFormulario();
                    Navigator.pop(context);
                  },
                  child: const Text('Cancelar'),
                ),
                ElevatedButton(
                  onPressed: () async {
                    if (_codigoController.text.isNotEmpty &&
                        _nombreController.text.isNotEmpty &&
                        _categoriaSeleccionada != null) {
                      
                      final prod = Producto(
                        id: producto?.id,
                        codigoBarras: _codigoController.text.trim(),
                        nombre: _nombreController.text.trim(),
                        categoria: _categoriaSeleccionada!,
                        descripcion: _descripcionController.text.trim(),
                        precioCompra: double.tryParse(_precioCompraController.text) ?? 0.0,
                        precioVenta: double.tryParse(_precioVentaController.text) ?? 0.0,
                        stockMinimo: double.tryParse(_stockMinimoController.text) ?? 0.0,
                        unidadMedida: _unidadMedida,
                        stock: producto?.stock ?? 0.0,
                      );

                      bool success;
                      if (producto == null) {
                        success = await inv.guardarProducto(prod);
                      } else {
                        success = await inv.actualizarProducto(producto.id!, prod);
                      }

                      if (success) {
                        _limpiarFormulario();
                        if (context.mounted) {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Producto guardado correctamente'),
                              backgroundColor: Colors.green,
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        }
                      }
                    }
                  },
                  child: const Text('Guardar'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final inv = Provider.of<InventoryProvider>(context);
    final auth = Provider.of<AuthProvider>(context);
    final formatCurrency = NumberFormat.simpleCurrency(decimalDigits: 2, name: 'S/. ');

    final productosFiltrados = inv.productos.where((p) {
      return p.nombre.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          p.codigoBarras.contains(_searchQuery);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Catálogo de Productos', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Theme.of(context).colorScheme.primaryContainer,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Buscar por nombre o código...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
              ),
              onChanged: (val) {
                setState(() {
                  _searchQuery = val;
                });
              },
            ),
          ),
          Expanded(
            child: inv.isLoading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: productosFiltrados.length,
                    itemBuilder: (context, index) {
                      final prod = productosFiltrados[index];
                      return Card(
                        child: ListTile(
                          title: Text(prod.nombre, style: const TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Text(
                            'Costo: ${formatCurrency.format(prod.precioCompra)} | Venta: ${formatCurrency.format(prod.precioVenta)}\nCategoría: ${prod.categoria.nombre}',
                            style: const TextStyle(fontSize: 12),
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (auth.isAdmin) ...[
                                IconButton(
                                  icon: const Icon(Icons.edit, color: Colors.blue),
                                  onPressed: () => _abrirDialogoProducto(context, producto: prod),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                                  onPressed: () async {
                                    final confirm = await showDialog<bool>(
                                      context: context,
                                      builder: (context) => AlertDialog(
                                        title: const Text('Eliminar Producto'),
                                        content: const Text('¿Estás seguro de eliminar este producto?'),
                                        actions: [
                                          TextButton(
                                            onPressed: () => Navigator.pop(context, false),
                                            child: const Text('No'),
                                          ),
                                          ElevatedButton(
                                            onPressed: () => Navigator.pop(context, true),
                                            child: const Text('Sí'),
                                          ),
                                        ],
                                      ),
                                    );
                                    if (confirm == true) {
                                      await inv.eliminarProducto(prod.id!);
                                    }
                                  },
                                ),
                              ] else ...[
                                Text(
                                  'Stock: ${prod.stock}',
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: auth.isAdmin
          ? FloatingActionButton(
              onPressed: () => _abrirDialogoProducto(context),
              child: const Icon(Icons.add),
            )
          : null,
    );
  }
}
