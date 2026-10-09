package com.minimarket.backend.service;

import com.minimarket.backend.model.Producto;
import com.minimarket.backend.model.Venta;
import com.minimarket.backend.model.DetalleVenta;
import com.minimarket.backend.repository.ProductoRepository;
import com.minimarket.backend.repository.VentaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class ReporteService {

    @Autowired
    private VentaRepository ventaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    public Map<String, Object> obtenerDashboard() {
        LocalDateTime inicioDia = LocalDate.now().atStartOfDay();
        LocalDateTime finDia = LocalDate.now().atTime(LocalTime.MAX);

        LocalDateTime inicioMes = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime finMes = LocalDate.now().atTime(LocalTime.MAX);

        BigDecimal ventasDia = ventaRepository.sumTotalSalesBetween(inicioDia, finDia);
        BigDecimal ventasMes = ventaRepository.sumTotalSalesBetween(inicioMes, finMes);

        long productosRegistrados = productoRepository.countActiveProducts();
        List<Producto> bajoStockList = productoRepository.findLowStockProducts();
        long productosBajoStock = bajoStockList != null ? bajoStockList.size() : 0;

        List<Venta> ultimasVentas = ventaRepository.findTop10ByOrderByFechaDesc();

        List<Object[]> topSellObj = ventaRepository.findTopSellingProducts();
        List<Map<String, Object>> topVendidos = new ArrayList<>();
        for (int i = 0; i < Math.min(topSellObj.size(), 5); i++) {
            Map<String, Object> map = new HashMap<>();
            map.put("producto", topSellObj.get(i)[0]);
            map.put("cantidad", topSellObj.get(i)[1]);
            topVendidos.add(map);
        }

        long numVentasDia = ventaRepository.countSalesBetween(inicioDia, finDia);

        BigDecimal ticketPromedio = BigDecimal.ZERO;
        if (numVentasDia > 0 && ventasDia != null && ventasDia.compareTo(BigDecimal.ZERO) > 0) {
            ticketPromedio = ventasDia.divide(BigDecimal.valueOf(numVentasDia), 2, java.math.RoundingMode.HALF_UP);
        }

        Map<String, BigDecimal> metodosPago = new HashMap<>();
        metodosPago.put("Efectivo", BigDecimal.ZERO);
        metodosPago.put("Yape", BigDecimal.ZERO);
        metodosPago.put("Plin", BigDecimal.ZERO);
        metodosPago.put("Tarjeta", BigDecimal.ZERO);

        List<Object[]> breakdownList = ventaRepository.sumSalesByMetodoPagoBetween(inicioDia, finDia);
        if (breakdownList != null) {
            for (Object[] row : breakdownList) {
                if (row.length >= 2 && row[0] != null) {
                    String metodo = (String) row[0];
                    BigDecimal totalMetodo = (BigDecimal) row[1];
                    if (metodosPago.containsKey(metodo)) {
                        metodosPago.put(metodo, totalMetodo != null ? totalMetodo : BigDecimal.ZERO);
                    }
                }
            }
        }

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("ventasDia", ventasDia != null ? ventasDia : BigDecimal.ZERO);
        dashboard.put("ventasMes", ventasMes != null ? ventasMes : BigDecimal.ZERO);
        dashboard.put("numVentasDia", numVentasDia);
        dashboard.put("ticketPromedio", ticketPromedio);
        dashboard.put("metodosPago", metodosPago);
        dashboard.put("productosRegistrados", productosRegistrados);
        dashboard.put("productosBajoStock", productosBajoStock);
        dashboard.put("bajoStockList", bajoStockList != null ? bajoStockList.stream().limit(6).toList() : Collections.emptyList());
        dashboard.put("ultimasVentas", ultimasVentas != null ? ultimasVentas : Collections.emptyList());
        dashboard.put("productosMasVendidos", topVendidos);

        return dashboard;
    }

    public Map<String, Object> generarReporteCompleto() {
        LocalDateTime inicioDia = LocalDate.now().atStartOfDay();
        LocalDateTime finDia = LocalDate.now().atTime(LocalTime.MAX);

        LocalDateTime inicioMes = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime finMes = LocalDate.now().atTime(LocalTime.MAX);

        LocalDateTime inicioSemana = LocalDate.now().minusDays(7).atStartOfDay();
        LocalDateTime finSemana = LocalDate.now().atTime(LocalTime.MAX);

        BigDecimal ventasDia = ventaRepository.sumTotalSalesBetween(inicioDia, finDia);
        BigDecimal ventasSemana = ventaRepository.sumTotalSalesBetween(inicioSemana, finSemana);
        BigDecimal ventasMes = ventaRepository.sumTotalSalesBetween(inicioMes, finMes);

        // Ganancias (Ventas totales - Costo de compra de esos productos vendidos)
        List<Venta> ventasDelDiaList = ventaRepository.findSalesBetween(inicioDia, finDia);
        BigDecimal gananciaDia = BigDecimal.ZERO;
        for (Venta v : ventasDelDiaList) {
            for (DetalleVenta dv : v.getDetalles()) {
                BigDecimal costoCompra = dv.getProducto().getPrecioCompra().multiply(dv.getCantidad());
                BigDecimal ventaEfectiva = dv.getSubtotal();
                gananciaDia = gananciaDia.add(ventaEfectiva.subtract(costoCompra));
            }
        }

        List<Venta> ventasDelMesList = ventaRepository.findSalesBetween(inicioMes, finMes);
        BigDecimal gananciaMes = BigDecimal.ZERO;
        for (Venta v : ventasDelMesList) {
            for (DetalleVenta dv : v.getDetalles()) {
                BigDecimal costoCompra = dv.getProducto().getPrecioCompra().multiply(dv.getCantidad());
                BigDecimal ventaEfectiva = dv.getSubtotal();
                gananciaMes = gananciaMes.add(ventaEfectiva.subtract(costoCompra));
            }
        }

        // Valor total del inventario
        List<Producto> productos = productoRepository.findAll();
        BigDecimal valorInventarioCosto = BigDecimal.ZERO;
        BigDecimal valorInventarioVenta = BigDecimal.ZERO;
        for (Producto p : productos) {
            if (p.getActivo()) {
                valorInventarioCosto = valorInventarioCosto.add(p.getStock().multiply(p.getPrecioCompra()));
                valorInventarioVenta = valorInventarioVenta.add(p.getStock().multiply(p.getPrecioVenta()));
            }
        }

        // Productos más y menos vendidos
        List<Object[]> topSellObj = ventaRepository.findTopSellingProducts();
        List<Map<String, Object>> masVendidos = convertToList(topSellObj);

        List<Object[]> leastSellObj = ventaRepository.findLeastSellingProducts();
        List<Map<String, Object>> menosVendidos = convertToList(leastSellObj);

        Map<String, Object> reporte = new HashMap<>();
        reporte.put("ventasDia", ventasDia);
        reporte.put("ventasSemana", ventasSemana);
        reporte.put("ventasMes", ventasMes);
        reporte.put("gananciaDiaria", gananciaDia);
        reporte.put("gananciaMensual", gananciaMes);
        reporte.put("valorInventarioCosto", valorInventarioCosto);
        reporte.put("valorInventarioVenta", valorInventarioVenta);
        reporte.put("productosMasVendidos", masVendidos);
        reporte.put("productosMenosVendidos", menosVendidos);

        return reporte;
    }

    private List<Map<String, Object>> convertToList(List<Object[]> list) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] obj : list) {
            Map<String, Object> map = new HashMap<>();
            map.put("producto", obj[0]);
            map.put("cantidad", obj[1]);
            result.add(map);
        }
        return result;
    }
}
