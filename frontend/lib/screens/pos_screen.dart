import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/cart_provider.dart';
import '../providers/inventory_provider.dart';
import '../models/models.dart';

class PosScreen extends StatefulWidget {
  const PosScreen({super.key});

  @override
  State<PosScreen> createState() => _PosScreenState();
}

class _PosScreenState extends State<PosScreen> {
  final _searchController = TextEditingController();
  final _dniController = TextEditingController();
  final _nombreClienteController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    _dniController.dispose();
    _nombreClienteController.dispose();
    super.dispose();
  }

  void _simularEscaneoCodigo(BuildContext context) {
    final inv = Provider.of<InventoryProvider>(context, listen: false);
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.qr_code_scanner_rounded, color: Colors.teal),
              SizedBox(width: 10),
              Text('Simulador de Escáner'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Selecciona un código de barras de prueba para simular lectura de cámara:'),
              const SizedBox(height: 16),
              SizedBox(
                height: 200,
                width: double.maxFinite,
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: inv.productos.length,
                  itemBuilder: (context, index) {
                    final prod = inv.productos[index];
                    return ListTile(
                      title: Text(prod.nombre),
                      subtitle: Text('Código: ${prod.codigoBarras}'),
                      trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                      onTap: () {
                        Provider.of<CartProvider>(context, listen: false).agregarProducto(prod);
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('${prod.nombre} agregado al carrito'),
                            behavior: SnackBarBehavior.floating,
                            backgroundColor: Colors.teal,
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cerrar'),
            ),
          ],
        );
      },
    );
  }

  void _abrirDialogoCliente(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Vincular Cliente'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: _dniController,
                decoration: const InputDecoration(
                  labelText: 'DNI del Cliente (8 dígitos)',
                  prefixIcon: Icon(Icons.badge_outlined),
                ),
                keyboardType: TextInputType.number,
                maxLength: 8,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _nombreClienteController,
                decoration: const InputDecoration(
                  labelText: 'Nombre Completo',
                  prefixIcon: Icon(Icons.person_outline),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                _dniController.clear();
                _nombreClienteController.clear();
                Navigator.pop(context);
              },
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () async {
                final dni = _dniController.text.trim();
                final nombre = _nombreClienteController.text.trim();
                if (dni.length == 8 && nombre.isNotEmpty) {
                  final cliente = Cliente(nombre: nombre, dni: dni);
                  
                  // Guardar cliente en backend e inyectar al provider
                  final inv = Provider.of<InventoryProvider>(context, listen: false);
                  await inv.guardarCliente(cliente);
                  
                  // Seleccionar cliente en el POS
                  if (context.mounted) {
                    final savedClient = inv.clientes.firstWhere((c) => c.dni == dni, orElse: () => cliente);
                    Provider.of<CartProvider>(context, listen: false).seleccionarCliente(savedClient);
                  }
                  
                  _dniController.clear();
                  _nombreClienteController.clear();
                  if (context.mounted) Navigator.pop(context);
                }
              },
              child: const Text('Vincular'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final inv = Provider.of<InventoryProvider>(context);
    final cart = Provider.of<CartProvider>(context);
    final formatCurrency = NumberFormat.simpleCurrency(decimalDigits: 2, name: 'S/. ');

    // Filtrar productos
    final productosFiltrados = inv.productos.where((p) {
      return p.nombre.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          p.codigoBarras.contains(_searchQuery);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Punto de Venta (POS)', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Theme.of(context).colorScheme.primaryContainer,
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner_rounded),
            tooltip: 'Simular escáner cámara',
            onPressed: () => _simularEscaneoCodigo(context),
          ),
          IconButton(
            icon: const Icon(Icons.delete_sweep_outlined, color: Colors.redAccent),
            tooltip: 'Limpiar carrito',
            onPressed: () => cart.limpiar(),
          ),
        ],
      ),
      body: Row(
        children: [
          // Lado Izquierdo: Buscador y Catálogo de Productos (para tablets/layouts responsivos)
          Expanded(
            flex: 6,
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                children: [
                  TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Buscar por nombre o código...',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear),
                              onPressed: () {
                                _searchController.clear();
                                setState(() => _searchQuery = '');
                              },
                            )
                          : null,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    onChanged: (val) {
                      setState(() {
                        _searchQuery = val;
                      });
                    },
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: inv.isLoading
                        ? const Center(child: CircularProgressIndicator())
                        : GridView.builder(
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              childAspectRatio: 1.15,
                              crossAxisSpacing: 10,
                              mainAxisSpacing: 10,
                            ),
                            itemCount: productosFiltrados.length,
                            itemBuilder: (context, index) {
                              final prod = productosFiltrados[index];
                              final hasStock = prod.stock > 0;
                              return Card(
                                elevation: 1,
                                color: hasStock ? null : Colors.grey.shade300.withOpacity(0.4),
                                child: InkWell(
                                  onTap: hasStock ? () => cart.agregarProducto(prod) : null,
                                  borderRadius: BorderRadius.circular(16),
                                  child: Padding(
                                    padding: const EdgeInsets.all(10.0),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              prod.nombre,
                                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                            Text(
                                              prod.categoria.nombre,
                                              style: const TextStyle(fontSize: 10, color: Colors.grey),
                                            ),
                                          ],
                                        ),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.between,
                                          children: [
                                            Text(
                                              formatCurrency.format(prod.precioVenta),
                                              style: TextStyle(
                                                color: Theme.of(context).colorScheme.primary,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 14,
                                              ),
                                            ),
                                            Text(
                                              'Stock: ${prod.stock}',
                                              style: TextStyle(
                                                fontSize: 11,
                                                color: prod.stock <= prod.stockMinimo
                                                    ? Colors.orange
                                                    : Colors.green,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            ),
          ),

          // Lado Derecho: Carrito y Opciones de Pago (POS)
          VerticalDivider(width: 1, color: Colors.grey.shade300),
          Expanded(
            flex: 5,
            child: Column(
              children: [
                // Cabecera Carrito
                Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      const Text(
                        'Detalle Venta',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      TextButton.icon(
                        icon: const Icon(Icons.person_add_alt_1_outlined, size: 18),
                        label: Text(
                          cart.clienteSeleccionado != null
                              ? cart.clienteSeleccionado!.nombre
                              : 'Cliente',
                          overflow: TextOverflow.ellipsis,
                        ),
                        onPressed: () => _abrirDialogoCliente(context),
                      ),
                    ],
                  ),
                ),

                // Lista de Items en Carrito
                Expanded(
                  child: cart.items.isEmpty
                      ? const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.shopping_cart_outlined, size: 48, color: Colors.grey),
                              SizedBox(height: 8),
                              Text('Carrito vacío', style: TextStyle(color: Colors.grey)),
                            ],
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          itemCount: cart.items.length,
                          separatorBuilder: (_, __) => const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final item = cart.items[index];
                            return ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text(item.producto.nombre, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                              subtitle: Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.remove_circle_outline, size: 20),
                                    onPressed: () => cart.actualizarCantidad(
                                        item.producto.id!, item.cantidad - 1),
                                  ),
                                  Text('${item.cantidad}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                  IconButton(
                                    icon: const Icon(Icons.add_circle_outline, size: 20),
                                    onPressed: () => cart.actualizarCantidad(
                                        item.producto.id!, item.cantidad + 1),
                                  ),
                                ],
                              ),
                              trailing: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(formatCurrency.format(item.subtotal), style: const TextStyle(fontWeight: FontWeight.bold)),
                                  GestureDetector(
                                    onTap: () => cart.eliminarItem(item.producto.id!),
                                    child: const Icon(Icons.delete_outline, color: Colors.red, size: 18),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                ),

                // Métodos de Pago
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 12.0),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: ['Efectivo', 'Tarjeta', 'Yape', 'Plin'].map((metodo) {
                        final isSelected = cart.metodoPago == metodo;
                        return Padding(
                          padding: const EdgeInsets.only(right: 6.0),
                          child: ChoiceChip(
                            label: Text(metodo),
                            selected: isSelected,
                            onSelected: (val) {
                              if (val) cart.setMetodoPago(metodo);
                            },
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),

                // Resumen Financiero y Botón Procesar
                Card(
                  margin: const EdgeInsets.all(12.0),
                  child: Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.between,
                          children: [
                            const Text('Subtotal (Sin IGV):'),
                            Text(formatCurrency.format(cart.subtotal)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.between,
                          children: [
                            const Text('IGV (18%):'),
                            Text(formatCurrency.format(cart.igv)),
                          ],
                        ),
                        const Divider(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.between,
                          children: [
                            const Text(
                              'Total a Pagar:',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            Text(
                              formatCurrency.format(cart.total),
                              style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                  color: Theme.of(context).colorScheme.primary),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Theme.of(context).colorScheme.primary,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12)),
                            ),
                            onPressed: cart.isSaving || cart.items.isEmpty
                                ? null
                                : () async {
                                    final success = await cart.registrarVenta();
                                    if (success) {
                                      if (context.mounted) {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          const SnackBar(
                                            content: Text('Venta procesada con éxito'),
                                            backgroundColor: Colors.green,
                                            behavior: SnackBarBehavior.floating,
                                          ),
                                        );
                                      }
                                    } else {
                                      if (context.mounted) {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(
                                            content: Text(cart.errorMessage ?? 'Error al procesar venta'),
                                            backgroundColor: Colors.redAccent,
                                            behavior: SnackBarBehavior.floating,
                                          ),
                                        );
                                      }
                                    }
                                  },
                            child: cart.isSaving
                                ? const CircularProgressIndicator(color: Colors.white)
                                : const Text('Confirmar Venta', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
