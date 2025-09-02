import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  await prisma.user.upsert({
    where: { id: "test-user-1" },
    update: {},
    create: {
      id: "test-user-1",
      name: "Test User",
      email: "test@example.com",
      balance: 1000,
      role: "USER",
    },
  });

  console.log("✅ Seeding completed! Test user created.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error during seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
