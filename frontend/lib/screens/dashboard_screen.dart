import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/auth_provider.dart';
import '../providers/inventory_provider.dart';
import '../services/api_service.dart';
import 'pos_screen.dart';
import 'inventory_screen.dart';
import 'products_screen.dart';
import 'reports_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _metrics;
  bool _isLoadingMetrics = true;

  @override
  void initState() {
    super.initState();
    _cargarDashboard();
  }

  Future<void> _cargarDashboard() async {
    setState(() => _isLoadingMetrics = true);
    try {
      // Cargar inventarios básicos
      await Provider.of<InventoryProvider>(context, listen: false).cargarTodo();

      // Cargar métricas adicionales si es admin
      final isAdmin = Provider.of<AuthProvider>(context, listen: false).isAdmin;
      if (isAdmin) {
        final response = await ApiService.get('/reportes/dashboard');
        if (response.statusCode == 200) {
          setState(() {
            _metrics = json.decode(response.body);
          });
        }
      }
    } catch (e) {
      debugPrint('Error al cargar datos del dashboard: $e');
    } finally {
      setState(() => _isLoadingMetrics = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final inv = Provider.of<InventoryProvider>(context);
    final formatCurrency = NumberFormat.simpleCurrency(decimalDigits: 2, name: 'S/. ');
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Calcular datos de dashboard básicos para empleados si no tienen acceso al api/reportes
    final double ventasDiaFallback = 0.0;
    final int totalProductos = inv.productos.length;
    final int productosBajoStock = inv.bajoStock.length;

    final double ventasDia = _metrics != null ? (_metrics!['ventasDia'] ?? 0.0).toDouble() : ventasDiaFallback;
    final double ventasMes = _metrics != null ? (_metrics!['ventasMes'] ?? 0.0).toDouble() : 0.0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard Minimarket', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Theme.of(context).colorScheme.primaryContainer,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _cargarDashboard,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => auth.logout(),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Banner de Bienvenida
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  radius: 28,
                  child: Text(
                    auth.nombre?.substring(0, 1).toUpperCase() ?? 'U',
                    style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hola, ${auth.nombre} 👋',
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      auth.isAdmin ? 'Administrador' : 'Empleado de Ventas',
                      style: TextStyle(color: Theme.of(context).colorScheme.secondary, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Alerta Stock Crítico
            if (productosBajoStock > 0)
              Card(
                color: isDark ? const Color(0xFF3E1C1C) : const Color(0xFFFFEBEE),
                shape: RoundedRectangleBorder(
                  side: BorderSide(color: Colors.red.shade300),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: ListTile(
                  leading: const Icon(Icons.warning_amber_rounded, color: Colors.red, size: 36),
                  title: const Text(
                    'Alerta de Stock Crítico',
                    style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(
                    'Hay $productosBajoStock producto(s) por debajo del stock mínimo.',
                    style: TextStyle(color: isDark ? Colors.red.shade100 : Colors.red.shade900),
                  ),
                  trailing: TextButton(
                    onPressed: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const InventoryScreen()));
                    },
                    child: const Text('Ver', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                  ),
                ),
              ),
            const SizedBox(height: 20),

            // Tarjetas de Métricas (Solo Admin ve ventas, Empleado ve catálogo básico)
            if (auth.isAdmin) ...[
              const Text('Métricas Financieras', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _buildMetricCard(
                      context,
                      'Ventas del Día',
                      formatCurrency.format(ventasDia),
                      Icons.today,
                      Colors.blue,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildMetricCard(
                      context,
                      'Ventas del Mes',
                      formatCurrency.format(ventasMes),
                      Icons.calendar_month,
                      Colors.green,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
            ],

            const Text('Resumen del Catálogo', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _buildMetricCard(
                    context,
                    'Productos Registrados',
                    '$totalProductos',
                    Icons.inventory_2,
                    Colors.purple,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildMetricCard(
                    context,
                    'Bajo Stock Mínimo',
                    '$productosBajoStock',
                    Icons.trending_down,
                    productosBajoStock > 0 ? Colors.amber : Colors.green,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Accesos Rápidos
            const Text('Acciones Rápidas', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.4,
              children: [
                _buildQuickActionCard(
                  context,
                  'Punto de Venta (POS)',
                  Icons.point_of_sale_rounded,
                  Colors.teal,
                  () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PosScreen())),
                ),
                _buildQuickActionCard(
                  context,
                  'Catálogo de Productos',
                  Icons.grid_view_rounded,
                  Colors.indigo,
                  () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsScreen())),
                ),
                if (auth.isAdmin) ...[
                  _buildQuickActionCard(
                    context,
                    'Inventario y Stock',
                    Icons.warehouse_rounded,
                    Colors.orange,
                    () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InventoryScreen())),
                  ),
                  _buildQuickActionCard(
                    context,
                    'Reportes Financieros',
                    Icons.bar_chart_rounded,
                    Colors.pink,
                    () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ReportsScreen())),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard(BuildContext context, String label, String value, IconData icon, Color color) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 12),
            Text(label, style: const TextStyle(fontSize: 14, color: Colors.grey, fontWeight: FontWeight.w500)),
            const SizedBox(height: 4),
            Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActionCard(BuildContext context, String title, IconData icon, Color color, VoidCallback onTap) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [color.withOpacity(0.85), color],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: Colors.white, size: 32),
              const SizedBox(height: 12),
              Text(
                title,
                style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
