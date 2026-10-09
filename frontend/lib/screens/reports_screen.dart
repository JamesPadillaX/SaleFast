import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:excel/excel.dart' as ex;
import '../services/api_service.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  Map<String, dynamic>? _reportData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _cargarReportes();
  }

  Future<void> _cargarReportes() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService.get('/reportes/completo');
      if (response.statusCode == 200) {
        setState(() {
          _reportData = json.decode(response.body);
        });
      }
    } catch (e) {
      debugPrint('Error al cargar reportes: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _exportarPDF() async {
    if (_reportData == null) return;
    
    final pdf = pw.Document();
    
    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (pw.Context context) {
          return pw.Padding(
            padding: const pw.EdgeInsets.all(24),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text('Reporte Financiero de Ventas - Minimarket', style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold)),
                pw.SizedBox(height: 8),
                pw.Text('Generado el: ${DateFormat('dd/MM/yyyy HH:mm').format(DateTime.now())}'),
                pw.Divider(),
                pw.SizedBox(height: 16),
                
                pw.Text('Métricas Principales:', style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold)),
                pw.Bullet(text: 'Ventas del Día: S/. ${_reportData!['ventasDia'] ?? 0.0}'),
                pw.Bullet(text: 'Ventas de la Semana: S/. ${_reportData!['ventasSemana'] ?? 0.0}'),
                pw.Bullet(text: 'Ventas del Mes: S/. ${_reportData!['ventasMes'] ?? 0.0}'),
                pw.Bullet(text: 'Ganancia Diaria Estimada: S/. ${_reportData!['gananciaDiaria'] ?? 0.0}'),
                pw.Bullet(text: 'Ganancia Mensual Estimada: S/. ${_reportData!['gananciaMensual'] ?? 0.0}'),
                pw.Bullet(text: 'Valor de Inventario (Precio Costo): S/. ${_reportData!['valorInventarioCosto'] ?? 0.0}'),
                pw.Bullet(text: 'Valor de Inventario (Precio Venta): S/. ${_reportData!['valorInventarioVenta'] ?? 0.0}'),
                
                pw.SizedBox(height: 24),
                pw.Text('Productos más Vendidos:', style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold)),
                for (var p in (_reportData!['productosMasVendidos'] as List? ?? []))
                  pw.Bullet(text: '${p['producto']}: ${p['cantidad']} unidades'),
              ],
            ),
          );
        },
      ),
    );

    // En un dispositivo real, guardarías este archivo o usarías share.
    // Simularemos la descarga e informaremos al usuario.
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Reporte exportado a PDF correctamente (Simulado en Descargas)'),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _exportarExcel() async {
    if (_reportData == null) return;

    var excel = ex.Excel.createExcel();
    var sheet = excel['Reporte Financiero'];

    sheet.appendRow([ex.TextCellValue('Reporte Financiero - Minimarket')]);
    sheet.appendRow([ex.TextCellValue('Generado el'), ex.TextCellValue(DateFormat('dd/MM/yyyy HH:mm').format(DateTime.now()))]);
    sheet.appendRow([]);
    sheet.appendRow([ex.TextCellValue('Indicador'), ex.TextCellValue('Valor')]);
    sheet.appendRow([ex.TextCellValue('Ventas Día'), ex.DoubleCellValue((_reportData!['ventasDia'] ?? 0.0).toDouble())]);
    sheet.appendRow([ex.TextCellValue('Ventas Semana'), ex.DoubleCellValue((_reportData!['ventasSemana'] ?? 0.0).toDouble())]);
    sheet.appendRow([ex.TextCellValue('Ventas Mes'), ex.DoubleCellValue((_reportData!['ventasMes'] ?? 0.0).toDouble())]);
    sheet.appendRow([ex.TextCellValue('Ganancia Diaria'), ex.DoubleCellValue((_reportData!['gananciaDiaria'] ?? 0.0).toDouble())]);
    sheet.appendRow([ex.TextCellValue('Ganancia Mensual'), ex.DoubleCellValue((_reportData!['gananciaMensual'] ?? 0.0).toDouble())]);
    sheet.appendRow([ex.TextCellValue('Valor Inventario Costo'), ex.DoubleCellValue((_reportData!['valorInventarioCosto'] ?? 0.0).toDouble())]);
    sheet.appendRow([ex.TextCellValue('Valor Inventario Venta'), ex.DoubleCellValue((_reportData!['valorInventarioVenta'] ?? 0.0).toDouble())]);

    // Simular descarga
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Reporte exportado a Excel (.xlsx) correctamente (Simulado en Descargas)'),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final formatCurrency = NumberFormat.simpleCurrency(decimalDigits: 2, name: 'S/. ');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reportes de Gestión', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Theme.of(context).colorScheme.primaryContainer,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _cargarReportes,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _reportData == null
              ? const Center(child: Text('No se pudieron obtener los datos'))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Botones de Exportar
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.redAccent,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              icon: const Icon(Icons.picture_as_pdf),
                              label: const Text('Exportar PDF'),
                              onPressed: _exportarPDF,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green.shade700,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              icon: const Icon(Icons.table_chart),
                              label: const Text('Exportar Excel'),
                              onPressed: _exportarExcel,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // Tarjeta Ganancias
                      Card(
                        color: Theme.of(context).colorScheme.secondaryContainer,
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Ganancia Neta Mensual',
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.onSecondaryContainer.withOpacity(0.8),
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                formatCurrency.format(_reportData!['gananciaMensual'] ?? 0.0),
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.primary,
                                  fontSize: 28,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const Divider(height: 24),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.between,
                                children: [
                                  Text('Ganancia Diaria:', style: TextStyle(color: Theme.of(context).colorScheme.onSecondaryContainer)),
                                  Text(
                                    formatCurrency.format(_reportData!['gananciaDiaria'] ?? 0.0),
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Tarjeta Valores de Inventario
                      const Text('Valoración de Inventario', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 10),
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.between,
                                children: [
                                  const Text('Valor a precio costo de compra:'),
                                  Text(
                                    formatCurrency.format(_reportData!['valorInventarioCosto'] ?? 0.0),
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.between,
                                children: [
                                  const Text('Valor a precio venta al público:'),
                                  Text(
                                    formatCurrency.format(_reportData!['valorInventarioVenta'] ?? 0.0),
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: Theme.of(context).colorScheme.primary,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Productos Más Vendidos
                      const Text('Productos más Vendidos', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 10),
                      Card(
                        child: ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: (_reportData!['productosMasVendidos'] as List? ?? []).length,
                          separatorBuilder: (_, __) => const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final p = (_reportData!['productosMasVendidos'] as List)[index];
                            return ListTile(
                              leading: CircleAvatar(
                                child: Text('${index + 1}'),
                              ),
                              title: Text(p['producto'] ?? 'Producto'),
                              trailing: Text(
                                '${p['cantidad']} unidades',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }
}
