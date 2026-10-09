import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/inventory_provider.dart';
import '../models/models.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _cantidadController = TextEditingController();
  final _motivoController = TextEditingController();
  Producto? _productoSeleccionado;
  String _tipoMovimiento = 'Entrada'; // 'Entrada', 'Salida', 'Ajuste'

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _cantidadController.dispose();
    _motivoController.dispose();
    super.dispose();
  }

  Color _obtenerColorStock(double stock, double minimo) {
    if (stock <= minimo) {
      return Colors.red; // Stock crítico
    } else if (stock <= minimo * 1.5) {
      return Colors.amber; // Bajo stock
    } else {
      return Colors.green; // Stock normal
    }
  }

  void _abrirDialogoMovimiento(BuildContext context) {
    final inv = Provider.of<InventoryProvider>(context, listen: false);
    _productoSeleccionado = inv.productos.isNotEmpty ? inv.productos.first : null;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: const Text('Registrar Movimiento'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    DropdownButtonFormField<Producto>(
                      value: _productoSeleccionado,
                      decoration: const InputDecoration(labelText: 'Producto'),
                      items: inv.productos.map((p) {
                        return DropdownMenuItem(
                          value: p,
                          child: Text(p.nombre, overflow: TextOverflow.ellipsis),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() {
                          _productoSeleccionado = val;
                        });
                      },
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: _tipoMovimiento,
                      decoration: const InputDecoration(labelText: 'Tipo de Movimiento'),
                      items: ['Entrada', 'Salida', 'Ajuste'].map((t) {
                        return DropdownMenuItem(value: t, child: Text(t));
                      }).toList(),
                      onChanged: (val) {
                        setState(() {
                          _tipoMovimiento = val!;
                        });
                      },
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _cantidadController,
                      decoration: const InputDecoration(
                        labelText: 'Cantidad',
                        prefixIcon: Icon(Icons.calculate_outlined),
                      ),
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _motivoController,
                      decoration: const InputDecoration(
                        labelText: 'Motivo / Observación',
                        prefixIcon: Icon(Icons.edit_note_outlined),
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    _cantidadController.clear();
                    _motivoController.clear();
                    Navigator.pop(context);
                  },
                  child: const Text('Cancelar'),
                ),
                ElevatedButton(
                  onPressed: () async {
                    final qty = double.tryParse(_cantidadController.text) ?? 0.0;
                    final motivo = _motivoController.text.trim();
                    if (_productoSeleccionado != null && qty > 0 && motivo.isNotEmpty) {
                      final success = await inv.registrarMovimientoManual(
                        _productoSeleccionado!.id!,
                        _tipoMovimiento,
                        qty,
                        motivo,
                      );
                      if (success) {
                        _cantidadController.clear();
                        _motivoController.clear();
                        if (context.mounted) {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Movimiento registrado correctamente'),
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
    final formatFecha = DateFormat('dd/MM/yyyy HH:mm');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventario y Movimientos', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Theme.of(context).colorScheme.primaryContainer,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.warehouse_rounded), text: 'Existencias'),
            Tab(icon: Icon(Icons.history_rounded), text: 'Historial Movimientos'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // 1. LISTA DE EXISTENCIAS
          inv.isLoading
              ? const Center(child: CircularProgressIndicator())
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: inv.productos.length,
                  itemBuilder: (context, index) {
                    final prod = inv.productos[index];
                    final colorStock = _obtenerColorStock(prod.stock, prod.stockMinimo);
                    return Card(
                      child: ListTile(
                        title: Text(prod.nombre, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(
                          'Mínimo: ${prod.stockMinimo} ${prod.unidadMedida} | Código: ${prod.codigoBarras}',
                          style: const TextStyle(fontSize: 12),
                        ),
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: colorStock.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: colorStock),
                          ),
                          child: Text(
                            '${prod.stock} ${prod.unidadMedida}',
                            style: TextStyle(color: colorStock, fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                        ),
                      ),
                    );
                  },
                ),

          // 2. HISTORIAL DE MOVIMIENTOS
          inv.isLoading
              ? const Center(child: CircularProgressIndicator())
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: inv.movimientos.length,
                  itemBuilder: (context, index) {
                    final mov = inv.movimientos[index];
                    final isEntrada = mov.tipo == 'Entrada';
                    return Card(
                      child: ListTile(
                        leading: Icon(
                          isEntrada ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
                          color: isEntrada ? Colors.green : Colors.red,
                        ),
                        title: Text('${mov.producto.nombre} (${mov.tipo})'),
                        subtitle: Text(
                          'Motivo: ${mov.motivo}\nPor: ${mov.nombreUsuario} - ${formatFecha.format(mov.fecha)}',
                          style: const TextStyle(fontSize: 12),
                        ),
                        trailing: Text(
                          '${isEntrada ? "+" : "-"}${mov.cantidad} ${mov.producto.unidadMedida}',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: isEntrada ? Colors.green : Colors.red,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _abrirDialogoMovimiento(context),
        label: const Text('Registrar Movimiento'),
        icon: const Icon(Icons.add),
      ),
    );
  }
}
