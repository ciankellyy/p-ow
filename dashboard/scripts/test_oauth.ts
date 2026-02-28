import { PrismaClient } from "@prisma/client"
import fetch from "node-fetch"
const prisma = new PrismaClient()

async function run() {
    const member = await prisma.member.findFirst({
        where: { discordId: { not: null } }
    })
    console.log("Member:", member?.userId)
}
run()
