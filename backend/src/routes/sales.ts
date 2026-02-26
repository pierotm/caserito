import { Prisma, SaleStatus, UnitMeasure } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../utils/prisma.js';

const router = Router();
router.use(requireAuth);

const saleInputSchema = z.object({
  clientSaleId: z.string().uuid(),
  date: z.coerce.date().optional(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.coerce.number().positive(),
      packApplied: z.boolean().optional().default(false)
    })
  ).min(1)
});

router.post('/', async (req, res, next) => {
  try {
    const input = saleInputSchema.parse(req.body);
    const storeId = req.auth!.storeId;

    const existing = await prisma.sale.findUnique({
      where: { storeId_clientSaleId: { storeId, clientSaleId: input.clientSaleId } },
      include: { details: true }
    });

    if (existing) {
      return res.status(200).json(existing);
    }

    const result = await prisma.$transaction(async (tx) => {
      const ids = input.items.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: ids }, storeId, isActive: true }
      });

      if (products.length !== ids.length) {
        throw new Error('Producto inválido en carrito');
      }

      const detailsToCreate: Prisma.SaleDetailCreateWithoutSaleInput[] = [];
      let total = 0;

      for (const item of input.items) {
        const product = products.find((prod) => prod.id === item.productId)!;

        if (product.unitMeasure === UnitMeasure.UNIDAD && !Number.isInteger(item.quantity)) {
          throw new Error(`Cantidad inválida para UNIDAD en ${product.name}`);
        }

        if (item.packApplied && (!product.packSize || product.unitMeasure !== UnitMeasure.UNIDAD)) {
          throw new Error(`Paquete inválido para ${product.name}`);
        }

        const stockToDiscount = item.packApplied
          ? item.quantity * (product.packSize as number)
          : item.quantity;

        if (Number(product.stock) < stockToDiscount) {
          throw new Error(`Stock insuficiente para ${product.name}`);
        }

        const subtotal = Number(product.price) * stockToDiscount;
        total += subtotal;

        detailsToCreate.push({
          product: { connect: { id: product.id } },
          unitMeasureSnapshot: product.unitMeasure,
          quantity: item.quantity,
          packApplied: item.packApplied,
          packSizeSnapshot: item.packApplied ? product.packSize : null,
          unitPrice: product.price,
          subtotal
        });

        await tx.product.update({
          where: { id: product.id },
          data: { stock: Number(product.stock) - stockToDiscount }
        });
      }

      return tx.sale.create({
        data: {
          storeId,
          clientSaleId: input.clientSaleId,
          total,
          date: input.date,
          status: SaleStatus.COMPLETED,
          details: { create: detailsToCreate }
        },
        include: { details: true }
      });
    });

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/void', async (req, res, next) => {
  try {
    const storeId = req.auth!.storeId;

    const sale = await prisma.sale.findFirst({
      where: { id: req.params.id, storeId },
      include: { details: true }
    });

    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    if (sale.status === SaleStatus.VOIDED) {
      return res.status(400).json({ message: 'La venta ya está anulada' });
    }

    await prisma.$transaction(async (tx) => {
      for (const detail of sale.details) {
        const restoreAmount = detail.packApplied
          ? Number(detail.quantity) * Number(detail.packSizeSnapshot)
          : Number(detail.quantity);

        await tx.product.update({
          where: { id: detail.productId },
          data: { stock: { increment: restoreAmount } }
        });
      }

      await tx.sale.update({
        where: { id: sale.id },
        data: { status: SaleStatus.VOIDED }
      });
    });

    return res.json({ message: 'Venta anulada correctamente' });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const month = z.string().regex(/^\d{4}-\d{2}$/).parse(req.query.month);
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);

    const sales = await prisma.sale.findMany({
      where: {
        storeId: req.auth!.storeId,
        date: { gte: start, lt: end }
      },
      include: { details: true },
      orderBy: { date: 'desc' }
    });

    return res.json(sales);
  } catch (error) {
    next(error);
  }
});

export default router;
