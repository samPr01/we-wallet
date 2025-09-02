import { PrismaClient } from "@prisma/client";

let prisma;

const createPrismaClient = (url) => new PrismaClient({
  datasources: { db: { url } },
});

async function initPrisma() {
  try {
    console.log("🔌 Connecting to Supabase Pooler...");
    prisma = createPrismaClient(process.env.DATABASE_URL_POOLER);
    await prisma.$connect();
    console.log("✅ Connected via Pooler (6543)");
  } catch (e) {
    console.error("⚠️ Pooler connection failed. Retrying with Direct (5432)...");
    prisma = createPrismaClient(process.env.DATABASE_URL_DIRECT);
    await prisma.$connect();
    console.log("✅ Connected via Direct (5432)");
  }
}

if (!global.prisma) {
  global.prisma = (async () => {
    await initPrisma();
    return prisma;
  })();
}

export default global.prisma;
