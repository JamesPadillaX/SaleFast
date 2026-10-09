# Minimarket POS - Sistema de Gestión de Inventario y Ventas

Este es un sistema integral y profesional diseñado para la gestión y control total de un minimarket. Cumple con la arquitectura distribuida moderna:

`Aplicación Móvil Flutter (Android)` ➔ `API REST Spring Boot` ➔ `Base de Datos PostgreSQL (Supabase)`

---

## 1. Modelo Entidad-Relación (Base de Datos)

A continuación se detalla la estructura relacional de la base de datos PostgreSQL:

```mermaid
erDiagram
    roles ||--o{ usuarios : "tiene"
    categorias ||--o{ productos : "clasifica"
    usuarios ||--o{ compras : "registra"
    usuarios ||--o{ ventas : "vende"
    usuarios ||--o{ movimientos_inventario : "autoriza"
    proveedores ||--o{ compras : "abastece"
    clientes ||--o{ ventas : "compra"
    compras ||--o{ detalle_compras : "contiene"
    productos ||--o{ detalle_compras : "incluido_en"
    ventas ||--o{ detalle_ventas : "contiene"
    productos ||--o{ detalle_ventas : "vendido_en"
    productos ||--o{ movimientos_inventario : "registra"

    roles {
        int id PK
        varchar nombre UNIQUE
    }
    usuarios {
        int id PK
        varchar username UNIQUE
        varchar password
        varchar nombre
        int rol_id FK
        boolean activo
        timestamp fecha_creacion
    }
    categorias {
        int id PK
        varchar nombre UNIQUE
        varchar descripcion
    }
    productos {
        int id PK
        varchar codigo_barras UNIQUE
        varchar nombre
        int categoria_id FK
        text descripcion
        numeric precio_compra
        numeric precio_venta
        numeric stock
        numeric stock_minimo
        varchar unidad_medida
        text imagen_url
        boolean activo
    }
    proveedores {
        int id PK
        varchar nombre
        varchar ruc UNIQUE
        varchar telefono
        varchar direccion
        varchar correo
    }
    clientes {
        int id PK
        varchar nombre
        varchar dni UNIQUE
        varchar telefono
    }
    compras {
        int id PK
        int proveedor_id FK
        int usuario_id FK
        timestamp fecha
        numeric total
    }
    detalle_compras {
        int id PK
        int compra_id FK
        int producto_id FK
        numeric cantidad
        numeric precio_unitario
        numeric subtotal
    }
    ventas {
        int id PK
        int cliente_id FK
        int usuario_id FK
        timestamp fecha
        numeric subtotal
        numeric igv
        numeric total
        varchar metodo_pago
    }
    detalle_ventas {
        int id PK
        int venta_id FK
        int producto_id FK
        numeric cantidad
        numeric precio_unitario
        numeric subtotal
    }
    movimientos_inventario {
        int id PK
        int producto_id FK
        varchar tipo
        numeric cantidad
        varchar motivo
        int usuario_id FK
        timestamp fecha
    }
```

---

## 2. Estructura de Carpetas del Proyecto

```text
Minimarket/
├── database/
│   ├── schema.sql             # Definición de tablas, índices y llaves foráneas
│   └── seed.sql               # Datos iniciales (roles, usuarios, categorías, productos de prueba)
├── backend/
│   ├── pom.xml                # Dependencias de Maven (Spring Boot, Security, JWT, JPA, OpenAPI)
│   └── src/main/
│       ├── java/com/minimarket/backend/
│       │   ├── MinimarketBackendApplication.java  # Clase de inicio
│       │   ├── config/        # Configuración de Seguridad, JWT, CORS
│       │   ├── controller/    # API REST Controllers
│       │   ├── exception/     # Manejador global de excepciones
│       │   ├── model/         # Entidades JPA (PostgreSQL)
│       │   ├── repository/    # Repositorios JPA
│       │   └── service/       # Lógica transaccional (Ventas, Compras, Inventario)
│       └── resources/
│           └── application.properties  # Configuración de puerto, DB y claves JWT
└── frontend/
    ├── pubspec.yaml           # Dependencias de Flutter (provider, http, pdf, excel, fonts)
    └── lib/
        ├── main.dart          # Inicialización y Theme de Material Design 3
        ├── models/
        │   └── models.dart    # Modelos sincronizados con el Backend
        ├── services/
        │   └── api_service.dart # Cliente REST para comunicación
        ├── providers/
        │   ├── auth_provider.dart      # Estado de autenticación y roles
        │   ├── cart_provider.dart      # Punto de venta (POS) y carrito
        │   └── inventory_provider.dart # Existencias y operaciones de stock
        └── screens/
            ├── login_screen.dart       # Vista de login
            ├── dashboard_screen.dart   # Panel principal dinámico por roles
            ├── pos_screen.dart         # Interfaz de Punto de Venta y simulador de escáner
            ├── inventory_screen.dart   # Vista de existencias y movimientos manuales
            ├── products_screen.dart    # Catálogo CRUD de productos
            └── reports_screen.dart     # Dashboard financiero y exportación PDF/Excel
```

---

## 3. Instrucciones de Ejecución Paso a Paso

### Prerrequisitos
- JDK 17 o superior.
- Flutter SDK (versión 3.0.0 o superior).
- Base de datos PostgreSQL activa (puede ser local o en Supabase).

### Paso 1: Configurar la Base de Datos
1. Crea una base de datos en tu servidor PostgreSQL o Supabase llamada `minimarket`.
2. Ejecuta el script `database/schema.sql` para generar la estructura.
3. Ejecuta el script `database/seed.sql` para poblar la información base de prueba.

### Paso 2: Ejecutar el Backend (Spring Boot)
1. Navega a la carpeta `/backend`.
2. Define las variables de entorno de tu base de datos o ajusta el archivo [application.properties](file:///c:/Minimarket/backend/src/main/resources/application.properties):
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/minimarket
   spring.datasource.username=tu_usuario
   spring.datasource.password=tu_contraseña
   ```
3. Ejecuta el backend utilizando Maven:
   ```bash
   mvn clean spring-boot:run
   ```
4. El servidor se iniciará en `http://localhost:8080`.
5. Accede a la documentación interactiva de la API con **Swagger UI**:
   - `http://localhost:8080/swagger-ui.html`

### Paso 3: Ejecutar la Aplicación Móvil (Flutter)
1. Navega a la carpeta `/frontend`.
2. Instala las dependencias:
   ```bash
   flutter pub get
   ```
3. Asegúrate de tener configurado tu emulador de Android.
4. Ejecuta la aplicación en modo desarrollo:
   ```bash
   flutter run
   ```

---

## 4. Credenciales de Acceso para Pruebas

| Usuario | Contraseña | Rol | Acceso |
| :--- | :--- | :--- | :--- |
| **admin** | admin123 | `ROLE_ADMIN` | Acceso completo a métricas, reportes, inventario, compras y CRUD de productos. |
| **empleado** | admin123 | `ROLE_EMPLOYEE` | Acceso únicamente al Punto de Venta (POS) y visualización del catálogo de productos. |

---

## 5. Descripción de los Módulos del Sistema

### Autenticación y Seguridad
- **JWT (JSON Web Tokens)**: Cada llamada a la API incluye un encabezado de autorización Bearer con el token.
- **Control de Roles**: Spring Security restringe las operaciones de escritura de inventario, compras y reportes financieros únicamente a los usuarios con rol de Administrador.

### Punto de Venta (POS)
- Agrega productos buscando por nombre o simulando el escaneo de código de barras.
- Permite vincular el DNI del cliente para asociar la venta al historial de clientes.
- Realiza el cálculo automático de Subtotal, IGV (18% configurable) y Total.
- Al confirmar, efectúa un descuento de stock transaccional en el servidor.

### Control de Inventario
- **Código de colores visual**:
  - **Verde**: Stock normal.
  - **Amarillo**: Stock bajo (menos del 150% del mínimo).
  - **Rojo**: Stock crítico (igual o menor al mínimo).
- **Historial**: Cada alteración de stock (por venta, compra o ajuste manual) registra una fila en la tabla de movimientos indicando el responsable y el motivo.

### Reportes y Exportación
- **Dashboard**: Muestra de forma ejecutiva las ventas diarias/mensuales y productos con poco stock.
- **Ganancia Neta**: Resta el costo de compra original de los productos del valor final de venta.
- **Exportación**: Genera reportes interactivos simulando descargas a archivos PDF (con formato de impresión) y Excel (.xlsx).

---

## 6. Arquitectura para Producción y Escalabilidad

El proyecto está diseñado bajo los principios SOLID, separación de capas y código modular que facilitan su escalabilidad:
1. **Facturación Electrónica (Perú - SUNAT)**: La capa de servicios en `VentaService` puede expandirse agregando un componente de firma XML y comunicación con el OSE/PSE (proveedor de facturación electrónica) al momento de guardar la venta.
2. **Control de Caja (Apertura y Cierre)**: Se puede añadir una entidad `Caja` y `DetalleCaja` para controlar el flujo de dinero en efectivo ingresado en el turno de cada empleado.
3. **Múltiples Sucursales**: Las entidades de `Usuario`, `Producto` y `Venta` pueden asociarse a una llave foránea de la tabla `sucursales` para soportar control multi-tienda y almacenes distribuidos.
