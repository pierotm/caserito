import 'dotenv/config';
import bcrypt from 'bcrypt';
import { Prisma, SaleStatus, UnitMeasure } from '@prisma/client';
import { config } from '../config.js';
import { prisma } from '../utils/prisma.js';

const DEMO_EMAIL = 'demo@caserito.pe';
const DEMO_PASSWORD = 'Demo12345!';
const STORE_NAME = 'Mercado Central Demo';

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, config.bcryptRounds);

  const store = await prisma.store.upsert({
    where: { id: 'demo-store' },
    update: { name: STORE_NAME },
    create: { id: 'demo-store', name: STORE_NAME }
  });

  await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      storeId: store.id,
      passwordHash,
      requirePasswordReset: false
    },
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      storeId: store.id,
      requirePasswordReset: false
    }
  });

  await prisma.saleDetail.deleteMany({ where: { sale: { storeId: store.id } } });
  await prisma.sale.deleteMany({ where: { storeId: store.id } });
  await prisma.product.deleteMany({ where: { storeId: store.id } });

  const productsData: Prisma.ProductCreateManyInput[] = [
    {
      id: 'prod-arroz',
      storeId: store.id,
      name: 'Arroz a granel',
      price: 4.5,
      unitMeasure: UnitMeasure.KG,
      stock: 42.5,
      isFrequent: true,
      lowStockThreshold: 5
    },
    {
      id: 'prod-aceite',
      storeId: store.id,
      name: 'Aceite 1L',
      price: 11,
      unitMeasure: UnitMeasure.UNIDAD,
      stock: 30,
      isFrequent: true,
      lowStockThreshold: 5
    },
    {
      id: 'prod-cerveza',
      storeId: store.id,
      name: 'Cerveza botella',
      price: 6,
      unitMeasure: UnitMeasure.UNIDAD,
      stock: 120,
      isFrequent: true,
      packSize: 12,
      lowStockThreshold: 12
    },
    {
      id: 'prod-huevo',
      storeId: store.id,
      name: 'Huevo unidad',
      price: 0.8,
      unitMeasure: UnitMeasure.UNIDAD,
      stock: 200,
      isFrequent: false,
      lowStockThreshold: 20
    }
  ];

  await prisma.product.createMany({ data: productsData });

  const sale1 = await prisma.sale.create({
    data: {
      storeId: store.id,
      clientSaleId: '11111111-1111-1111-1111-111111111111',
      total: 57,
      date: new Date(),
      status: SaleStatus.COMPLETED
    }
  });

  await prisma.saleDetail.createMany({
    data: [
      {
        saleId: sale1.id,
        productId: 'prod-aceite',
        unitMeasureSnapshot: UnitMeasure.UNIDAD,
        quantity: 3,
        packApplied: false,
        unitPrice: 11,
        subtotal: 33
      },
      {
        saleId: sale1.id,
        productId: 'prod-arroz',
        unitMeasureSnapshot: UnitMeasure.KG,
        quantity: 2,
        packApplied: false,
        unitPrice: 4.5,
        subtotal: 9
      },
      {
        saleId: sale1.id,
        productId: 'prod-cerveza',
        unitMeasureSnapshot: UnitMeasure.UNIDAD,
        quantity: 2,
        packApplied: false,
        unitPrice: 6,
        subtotal: 12
      },
      {
        saleId: sale1.id,
        productId: 'prod-huevo',
        unitMeasureSnapshot: UnitMeasure.UNIDAD,
        quantity: 4,
        packApplied: false,
        unitPrice: 0.8,
        subtotal: 3
      }
    ]
  });

  const sale2 = await prisma.sale.create({
    data: {
      storeId: store.id,
      clientSaleId: '22222222-2222-2222-2222-222222222222',
      total: 72,
      date: new Date(),
      status: SaleStatus.VOIDED
    }
  });

  await prisma.saleDetail.create({
    data: {
      saleId: sale2.id,
      productId: 'prod-cerveza',
      unitMeasureSnapshot: UnitMeasure.UNIDAD,
      quantity: 1,
      packApplied: true,
      packSizeSnapshot: 12,
      unitPrice: 6,
      subtotal: 72
    }
  });

  console.log('✅ Datos demo listos');
  console.log(`Email: ${DEMO_EMAIL}`);
  console.log(`Password: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error('❌ Error generando demo:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
