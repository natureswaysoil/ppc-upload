const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.keyword.count();
  console.log(`Total keywords in database: ${count}`);
  
  if (count > 0) {
    const sample = await prisma.keyword.findMany({ take: 3 });
    console.log('\nSample keywords:', JSON.stringify(sample, null, 2));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
