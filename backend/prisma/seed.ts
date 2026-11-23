import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
  const passwordHash = await bcrypt.hash("Demo@12345", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@fincore.local" },
    update: {},
    create: { name: "Demo Customer", email: "demo@fincore.local", passwordHash }
  });
  await prisma.wallet.upsert({
    where: { id: "demo-wallet-001" },
    update: {},
    create: { id: "demo-wallet-001", userId: user.id, name: "Primary Wallet", currency: "INR", balance: "10000.00" }
  });
  console.log("Demo login: demo@fincore.local / Demo@12345");
}
main().finally(() => prisma.$disconnect());
