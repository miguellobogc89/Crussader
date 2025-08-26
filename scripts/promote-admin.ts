// scripts/promote-admin.ts
import { PrismaClient, Role } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const email = 'miguel.lobogc.89@gmail.com'
  const u = await prisma.user.update({
    where: { email },
    data: { role: Role.system_admin },
  })
  console.log('Promoted:', u.email, u.role)
}
main().finally(() => prisma.$disconnect())
