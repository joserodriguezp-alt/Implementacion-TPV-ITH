-- ============================================================
-- Sistema POS Papelería — Script de Creación de Base de Datos
-- Compatible con: PostgreSQL 14+ / SQLite 3.35+
-- Versión: 1.0 | Junio 2026
-- ============================================================

-- ------------------------------------------------------------
-- TABLA: usuarios
-- Almacena cajeros y administradores del sistema
-- ------------------------------------------------------------
CREATE TABLE usuarios (
    id_usuario      SERIAL          PRIMARY KEY,
    nombre          VARCHAR(60)     NOT NULL,
    email           VARCHAR(100)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    rol             VARCHAR(15)     NOT NULL DEFAULT 'cajero'
                                    CHECK (rol IN ('cajero', 'administrador')),
    activo          BOOLEAN         NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- TABLA: categorias
-- Clasificación de productos (ej: cuadernos, bolígrafos, etc.)
-- ------------------------------------------------------------
CREATE TABLE categorias (
    id_categoria    SERIAL          PRIMARY KEY,
    nombre          VARCHAR(80)     NOT NULL UNIQUE,
    descripcion     TEXT
);

-- ------------------------------------------------------------
-- TABLA: productos
-- Catálogo de productos con precios e inventario
-- ------------------------------------------------------------
CREATE TABLE productos (
    id_producto     SERIAL              PRIMARY KEY,
    codigo_barras   VARCHAR(30)         NOT NULL UNIQUE,
    nombre          VARCHAR(120)        NOT NULL,
    descripcion     TEXT,
    id_categoria    INT                 REFERENCES categorias(id_categoria)
                                            ON UPDATE CASCADE
                                            ON DELETE SET NULL,
    precio_compra   DECIMAL(10, 2)      NOT NULL CHECK (precio_compra >= 0),
    precio_venta    DECIMAL(10, 2)      NOT NULL CHECK (precio_venta >= 0),
    stock_actual    INT                 NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
    stock_minimo    INT                 NOT NULL DEFAULT 5  CHECK (stock_minimo >= 0),
    activo          BOOLEAN             NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_por INT                 REFERENCES usuarios(id_usuario)
                                            ON UPDATE CASCADE
                                            ON DELETE SET NULL
);

-- Índices para búsqueda rápida (HU-003: respuesta < 500 ms)
CREATE INDEX idx_productos_nombre        ON productos (nombre);
CREATE INDEX idx_productos_codigo_barras ON productos (codigo_barras);
CREATE INDEX idx_productos_activo        ON productos (activo);

-- ------------------------------------------------------------
-- TABLA: corte_caja
-- Registro de cortes de caja por día/turno
-- Se define antes de ventas porque ventas referencia id_corte
-- ------------------------------------------------------------
CREATE TABLE corte_caja (
    id_corte                    SERIAL          PRIMARY KEY,
    fecha_corte                 DATE            NOT NULL UNIQUE,
    fecha_apertura              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre                TIMESTAMP,
    id_usuario                  INT             NOT NULL
                                                REFERENCES usuarios(id_usuario)
                                                    ON UPDATE CASCADE,
    total_ventas_sistema        DECIMAL(12, 2)  NOT NULL DEFAULT 0,
    total_efectivo_sistema      DECIMAL(12, 2)  NOT NULL DEFAULT 0,
    total_tarjeta_sistema       DECIMAL(12, 2)  NOT NULL DEFAULT 0,
    total_devoluciones          DECIMAL(12, 2)  NOT NULL DEFAULT 0,
    monto_contado_fisico        DECIMAL(12, 2),
    diferencia                  DECIMAL(12, 2)
                                GENERATED ALWAYS AS
                                    (monto_contado_fisico - total_efectivo_sistema) STORED,
    observaciones               TEXT,
    estado                      VARCHAR(10)     NOT NULL DEFAULT 'abierto'
                                                CHECK (estado IN ('abierto', 'cerrado'))
);

CREATE INDEX idx_corte_fecha  ON corte_caja (fecha_corte);
CREATE INDEX idx_corte_estado ON corte_caja (estado);

-- ------------------------------------------------------------
-- TABLA: ventas
-- Encabezado de cada transacción de venta
-- ------------------------------------------------------------
CREATE TABLE ventas (
    id_venta            SERIAL          PRIMARY KEY,
    folio               VARCHAR(20)     NOT NULL UNIQUE,
    fecha_hora          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario          INT             NOT NULL
                                        REFERENCES usuarios(id_usuario)
                                            ON UPDATE CASCADE,
    subtotal            DECIMAL(12, 2)  NOT NULL CHECK (subtotal >= 0),
    descuento           DECIMAL(12, 2)  NOT NULL DEFAULT 0 CHECK (descuento >= 0),
    total               DECIMAL(12, 2)  NOT NULL CHECK (total >= 0),
    metodo_pago         VARCHAR(10)     NOT NULL
                                        CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'mixto')),
    monto_recibido      DECIMAL(12, 2)  NOT NULL CHECK (monto_recibido >= 0),
    cambio              DECIMAL(12, 2)  NOT NULL DEFAULT 0 CHECK (cambio >= 0),
    estado              VARCHAR(12)     NOT NULL DEFAULT 'completada'
                                        CHECK (estado IN ('completada', 'cancelada', 'devolucion')),
    motivo_cancelacion  TEXT,
    id_corte            INT             REFERENCES corte_caja(id_corte)
                                            ON UPDATE CASCADE
                                            ON DELETE SET NULL
);

CREATE INDEX idx_ventas_fecha_hora ON ventas (fecha_hora);
CREATE INDEX idx_ventas_estado     ON ventas (estado);
CREATE INDEX idx_ventas_id_corte   ON ventas (id_corte);
CREATE INDEX idx_ventas_folio      ON ventas (folio);

-- ------------------------------------------------------------
-- TABLA: detalle_venta
-- Líneas de productos por cada venta
-- ------------------------------------------------------------
CREATE TABLE detalle_venta (
    id_detalle          SERIAL          PRIMARY KEY,
    id_venta            INT             NOT NULL
                                        REFERENCES ventas(id_venta)
                                            ON UPDATE CASCADE
                                            ON DELETE CASCADE,
    id_producto         INT             NOT NULL
                                        REFERENCES productos(id_producto)
                                            ON UPDATE CASCADE,
    cantidad            INT             NOT NULL CHECK (cantidad > 0),
    precio_unitario     DECIMAL(10, 2)  NOT NULL CHECK (precio_unitario >= 0),
    descuento_linea     DECIMAL(10, 2)  NOT NULL DEFAULT 0 CHECK (descuento_linea >= 0),
    subtotal_linea      DECIMAL(12, 2)  NOT NULL CHECK (subtotal_linea >= 0)
);

CREATE INDEX idx_detalle_id_venta    ON detalle_venta (id_venta);
CREATE INDEX idx_detalle_id_producto ON detalle_venta (id_producto);

-- ------------------------------------------------------------
-- TABLA: movimientos_inventario
-- Bitácora de todos los cambios de stock (trazabilidad)
-- ------------------------------------------------------------
CREATE TABLE movimientos_inventario (
    id_movimiento   SERIAL          PRIMARY KEY,
    id_producto     INT             NOT NULL
                                    REFERENCES productos(id_producto)
                                        ON UPDATE CASCADE,
    tipo            VARCHAR(12)     NOT NULL
                                    CHECK (tipo IN ('entrada', 'salida', 'ajuste', 'devolucion')),
    cantidad        INT             NOT NULL,
    stock_anterior  INT             NOT NULL,
    stock_nuevo     INT             NOT NULL,
    id_usuario      INT             NOT NULL
                                    REFERENCES usuarios(id_usuario)
                                        ON UPDATE CASCADE,
    id_venta        INT             REFERENCES ventas(id_venta)
                                        ON UPDATE CASCADE
                                        ON DELETE SET NULL,
    observacion     TEXT,
    fecha_hora      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mov_id_producto ON movimientos_inventario (id_producto);
CREATE INDEX idx_mov_fecha_hora  ON movimientos_inventario (fecha_hora);
CREATE INDEX idx_mov_tipo        ON movimientos_inventario (tipo);

-- ============================================================
-- DATOS INICIALES
-- ============================================================

-- Usuario administrador por defecto (password debe cambiarse al primer login)
INSERT INTO usuarios (nombre, email, password_hash, rol)
VALUES ('Administrador', 'admin@papeleria.local',
        '$2b$10$placeholder_reemplazar_con_hash_real', 'administrador');

-- Categorías base para papelería
INSERT INTO categorias (nombre, descripcion) VALUES
    ('Cuadernos y Libretas',  'Cuadernos escolares, libretas, blocks'),
    ('Escritura',             'Bolígrafos, lápices, plumones, marcadores'),
    ('Papel',                 'Hojas blancas, de color, cartulinas'),
    ('Organización',          'Carpetas, folders, separadores, archiveros'),
    ('Arte y Manualidades',   'Pinturas, pinceles, pegamento, tijeras'),
    ('Tecnología',            'USB, pilas, cables, calculadoras'),
    ('Otros',                 'Artículos varios no clasificados');

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
