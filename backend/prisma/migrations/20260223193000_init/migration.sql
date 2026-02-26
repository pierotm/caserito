-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER');

-- CreateEnum
CREATE TYPE "UnitMeasure" AS ENUM ('UNIDAD', 'KG');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('COMPLETED', 'VOIDED');

CREATE TABLE "tiendas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tiendas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "tienda_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OWNER',
    "require_password_reset" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "tienda_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" DECIMAL(12,2) NOT NULL,
    "unidad_medida" "UnitMeasure" NOT NULL,
    "stock" DECIMAL(12,3) NOT NULL,
    "is_frecuente" BOOLEAN NOT NULL DEFAULT false,
    "pack_size" INTEGER,
    "low_stock_threshold" DECIMAL(12,3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ventas" (
    "id" TEXT NOT NULL,
    "tienda_id" TEXT NOT NULL,
    "client_sale_id" TEXT NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "venta_detalle" (
    "id" TEXT NOT NULL,
    "venta_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "unidad_medida_snapshot" "UnitMeasure" NOT NULL,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "pack_aplicado" BOOLEAN NOT NULL DEFAULT false,
    "pack_size_snapshot" INTEGER,
    "precio_unitario" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    CONSTRAINT "venta_detalle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
CREATE INDEX "productos_tienda_id_is_active_idx" ON "productos"("tienda_id", "is_active");
CREATE UNIQUE INDEX "ventas_tienda_id_client_sale_id_key" ON "ventas"("tienda_id", "client_sale_id");
CREATE INDEX "ventas_tienda_id_fecha_idx" ON "ventas"("tienda_id", "fecha");
CREATE INDEX "venta_detalle_venta_id_idx" ON "venta_detalle"("venta_id");

ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_tienda_id_fkey" FOREIGN KEY ("tienda_id") REFERENCES "tiendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "productos" ADD CONSTRAINT "productos_tienda_id_fkey" FOREIGN KEY ("tienda_id") REFERENCES "tiendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_tienda_id_fkey" FOREIGN KEY ("tienda_id") REFERENCES "tiendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "venta_detalle" ADD CONSTRAINT "venta_detalle_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "venta_detalle" ADD CONSTRAINT "venta_detalle_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
