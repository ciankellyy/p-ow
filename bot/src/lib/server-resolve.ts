import { ChatInputCommandInteraction } from "discord.js"
import { prisma } from "../client"

/**
 * Resolves the target Server ID for a command execution based on the Discord Guild ID.
 * Returns null if no server could be determined or found in the database.
 */
export async function resolveServer(interaction: ChatInputCommandInteraction): Promise<string | null> {
    if (interaction.guildId) {
        // Find the first server linked to this guild. 
        // If they have multiple, we just use the first one to avoid ambiguity errors 
        // since we removed the ability to specify a server manually.
        const server = await prisma.server.findFirst({
            where: { discordGuildId: interaction.guildId },
            orderBy: { createdAt: "asc" } // Predictably return the oldest/primary one
        })
        return server ? server.id : null
    }

    return null
}
