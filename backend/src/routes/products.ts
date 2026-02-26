import { UnitMeasure } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../utils/prisma.js';

const router = Router();
router.use(requireAuth);

const productSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().positive(),
  unitMeasure: z.nativeEnum(UnitMeasure),
  stock: z.coerce.number().min(0),
  isFrequent: z.boolean().default(false),
  packSize: z.coerce.number().int().positive().optional().nullable(),
  lowStockThreshold: z.coerce.number().positive().optional()
});

router.get('/', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { storeId: req.auth!.storeId, isActive: true },
      orderBy: [{ isFrequent: 'desc' }, { name: 'asc' }]
    });
    return res.json(products);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const input = productSchema.parse(req.body);
    if (input.unitMeasure === UnitMeasure.KG && input.packSize) {
      return res.status(400).json({ message: 'packSize solo aplica para UNIDAD' });
    }

    const lowStockThreshold =
      input.lowStockThreshold ?? (input.unitMeasure === UnitMeasure.UNIDAD ? 5 : 1);

    const product = await prisma.product.create({
      data: {
        storeId: req.auth!.storeId,
        name: input.name,
        price: input.price,
        unitMeasure: input.unitMeasure,
        stock: input.stock,
        isFrequent: input.isFrequent,
        packSize: input.unitMeasure === UnitMeasure.UNIDAD ? input.packSize : null,
        lowStockThreshold
      }
    });

    return res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const input = productSchema.partial().parse(req.body);
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, storeId: req.auth!.storeId, isActive: true }
    });

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const newUnit = input.unitMeasure ?? product.unitMeasure;
    const newPackSize = input.packSize === undefined ? product.packSize : input.packSize;

    if (newUnit === UnitMeasure.KG && newPackSize) {
      return res.status(400).json({ message: 'packSize solo aplica para UNIDAD' });
    }

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        name: input.name,
        price: input.price,
        stock: input.stock,
        isFrequent: input.isFrequent,
        unitMeasure: input.unitMeasure,
        lowStockThreshold: input.lowStockThreshold,
        packSize: newUnit === UnitMeasure.UNIDAD ? newPackSize : null
      }
    });

    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const saleDetail = await prisma.saleDetail.findFirst({
      where: {
        productId: req.params.id,
        sale: { storeId: req.auth!.storeId }
      }
    });

    if (saleDetail) {
      return res.status(409).json({ message: 'No se puede eliminar: producto con ventas' });
    }

    const product = await prisma.product.updateMany({
      where: { id: req.params.id, storeId: req.auth!.storeId, isActive: true },
      data: { isActive: false }
    });

    if (!product.count) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
