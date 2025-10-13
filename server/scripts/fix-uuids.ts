import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({ where: { uuid: null } });

  for (const client of clients) {
    await prisma.client.update({
      where: { id: client.id },
      data: { uuid: randomUUID() },
    });
  }

  console.log(`✅ Atualizados ${clients.length} clientes com UUIDs.`);
}

main().finally(() => prisma.$disconnect());
