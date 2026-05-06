import { pool } from "../../utils/db.ts";
import { Handlers } from "$fresh/server.ts";

async function handleWebhook(_req: Request) {
  const url = `https://sumo-api.com/api/webhook/test?type=${type}`;
  const destination =
    "https://fresh-sumo--local.teddosan.deno.net/api/webhook-ingestion";
  const secret = Deno.env.get("WEBHOOK_SECRET");
  const payload = {
    name: `test-${crypto.randomUUID()}`,
    destination: destination,
    secret: secret,
    subscriptions: {
      [type]: true,
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Webhook test triggered successfully:", data);
    return data;
  } catch (error) {
    console.error("Failed to test webhook:", error);
  }
}

// Usage Example:
// testWebhookSubscription("validWebhookType", "http://your-server.com/webhook", "super-secret-key");
