import 'dotenv/config';
import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { config } from '../config.js';
import { prisma } from '../utils/prisma.js';

function getArg(name: string): string | undefined {
  const found = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return found?.split('=')[1];
}

async function main() {
  const storeName = getArg('store');
  const email = getArg('email');

  if (!storeName || !email) {
    throw new Error('Uso: npm run create-store-user -w backend -- --store="Mi tienda" --email=owner@tienda.com');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('El email ya está en uso');
  }

  const tempPassword = randomBytes(6).toString('base64url');
  const passwordHash = await bcrypt.hash(tempPassword, config.bcryptRounds);

  const result = await prisma.$transaction(async (tx) => {
    const store = await tx.store.create({ data: { name: storeName } });
    const user = await tx.user.create({
      data: {
        storeId: store.id,
        email,
        passwordHash,
        requirePasswordReset: true
      }
    });

    return { store, user };
  });

  console.log('✅ Tienda y usuario creados');
  console.log(`Tienda ID: ${result.store.id}`);
  console.log(`Email: ${result.user.email}`);
  console.log(`Password temporal: ${tempPassword}`);
}

main()
  .catch((error) => {
    console.error('❌ Error creando tienda/usuario:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
