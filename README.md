# Caserito MVP

MVP full-stack para gestión de inventario y ventas de puestos de mercado (Perú), multi-tenant y con registro cerrado.

## Estructura

```
/
├── backend
│   ├── prisma
│   │   ├── schema.prisma
│   │   └── migrations
│   └── src
│       ├── middleware
│       ├── routes
│       ├── scripts
│       └── index.ts
└── frontend
    ├── public
    └── src
```

## Stack y decisiones técnicas

- **Backend:** Node.js + Express + TypeScript.
- **ORM/migraciones:** Prisma + PostgreSQL.
- **Auth:** JWT + bcrypt.
- **Validación:** Zod.
- **Frontend:** React + Vite + PWA (`vite-plugin-pwa`).
- **Registro cerrado:** no existe endpoint público de register; alta de tiendas/usuarios solo via script interno.

## Variables de entorno

### Backend (`backend/.env`)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/caserito"
JWT_SECRET="super-secret"
JWT_EXPIRES_IN="7d"
BCRYPT_ROUNDS="10"
PORT="4000"
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL="http://localhost:4000"
```

## Comandos iniciales (local)

```bash
npm install
npm run prisma:generate -w backend
npm run prisma:migrate -w backend
npm run dev
```

## Si te aparece "Missing environment variable: DATABASE_URL"

Ese error sale cuando todavía no existe `backend/.env`.

1. Crea el archivo desde el ejemplo:

```bash
cp backend/.env.example backend/.env
```

En PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
```

2. Levanta PostgreSQL y valida que `DATABASE_URL` apunte a tu base.
3. Recién ahí ejecuta:

```bash
npm run prisma:migrate -w backend
npm run create-demo-data -w backend
```

## Script de creación manual de tienda + owner

```bash
npm run create-store-user -w backend -- --store="Puesto Doña Rosa" --email=duena@puesto.pe
```

Salida esperada: imprime `store_id`, `email` y `password temporal`.

## Cuenta demo lista para probar todas las vistas

1. Ejecuta migraciones.
2. Carga datos demo:

```bash
npm run create-demo-data -w backend
```

Credenciales demo:
- **Email:** `demo@caserito.pe`
- **Password:** `Demo12345!`

Este script crea tienda demo, productos (UNIDAD/KG, incluyendo paquete), y ventas (completadas + anulada) para que puedas revisar Home, Productos, Reportes y Ajustes.

## Endpoints MVP implementados

### Auth
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/change-password`

### Productos
- `GET /products`
- `POST /products`
- `PUT /products/:id`
- `DELETE /products/:id` (soft-delete, bloquea si hay ventas)

### Ventas
- `POST /sales` (transacción + descuento stock + idempotencia por `client_sale_id`)
- `POST /sales/:id/void` (restaura stock)
- `GET /sales?month=YYYY-MM`

### Reportes
- `GET /reports/monthly?month=YYYY-MM`

## Deploy Railway (resumen)

1. Crear proyecto con servicio `backend` + PostgreSQL.
2. Configurar variables de entorno del backend.
3. Ejecutar migraciones al desplegar: `npm run prisma:deploy -w backend`.
4. Publicar frontend como sitio estático (Railway static o similar), con `VITE_API_URL` apuntando al backend.
