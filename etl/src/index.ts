import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

console.log(await client.oSB_AppVersion.findMany({ take: 10, select: {} }));

client.oSB_AppEntry.findMany({ select: {} });
