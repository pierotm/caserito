import { SaleStatus, UnitMeasure } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../utils/prisma.js';

const router = Router();
router.use(requireAuth);

router.get('/monthly', async (req, res, next) => {
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
      include: {
        details: {
          include: {
            product: { select: { name: true } }
          }
        }
      }
    });

    let totalSold = 0;
    let totalUnits = 0;
    let totalKg = 0;
    let voidedSales = 0;

    const productTotals = new Map<string, { name: string; quantity: number; type: UnitMeasure }>();

    for (const sale of sales) {
      if (sale.status === SaleStatus.VOIDED) {
        voidedSales += 1;
        continue;
      }

      totalSold += Number(sale.total);

      for (const detail of sale.details) {
        const normalizedQty = detail.packApplied
          ? Number(detail.quantity) * Number(detail.packSizeSnapshot)
          : Number(detail.quantity);

        if (detail.unitMeasureSnapshot === UnitMeasure.UNIDAD) {
          totalUnits += normalizedQty;
        } else {
          totalKg += normalizedQty;
        }

        const key = `${detail.productId}-${detail.unitMeasureSnapshot}`;
        const acc = productTotals.get(key) ?? {
          name: detail.product.name,
          quantity: 0,
          type: detail.unitMeasureSnapshot
        };
        acc.quantity += normalizedQty;
        productTotals.set(key, acc);
      }
    }

    const topProduct = [...productTotals.values()].sort((a, b) => b.quantity - a.quantity)[0] ?? null;

    return res.json({
      month,
      totalSold,
      totalUnits,
      totalKg,
      topProduct,
      voidedSales
    });
  } catch (error) {
    next(error);
  }
});

export default router;
