import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const phone = (process.env.ADMIN_PHONE ?? '13800000000').replace(/[\s-]/g, '');
  const password = process.env.ADMIN_PASSWORD ?? 'Admin123456';
  const name = process.env.ADMIN_NAME ?? 'Admin';

  const exists = await prisma.user.findUnique({ where: { phone } });
  if (exists) {
    console.log(`[seed] Admin already exists: ${phone}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      phone,
      passwordHash,
      name,
      role: UserRole.ADMIN,
    },
  });

  console.log(`[seed] Created admin: ${phone} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

