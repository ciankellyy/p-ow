import { clerkClient } from "@clerk/nextjs/server";
import dotenv from "dotenv";
dotenv.config();

async function testOauth() {
    try {
        const client = await clerkClient();
        const users = await client.users.getUserList({ limit: 1 });
        if (users.data.length === 0) {
            console.log("No users found");
            return;
        }
        const user = users.data[0];
        console.log("Testing OAuth for user", user.id);
        const tokens = await client.users.getUserOauthAccessToken(user.id, "oauth_discord");
        console.log("Tokens:", tokens.data);
    } catch(e) {
        console.error(e);
    }
}
testOauth();
