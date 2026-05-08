export async function triggerExternalWebhook(type: string) {
  if (!type) throw new Error("Missing 'type'");

  const url = `https://sumo-api.com/api/webhook/test?type=${type}`;
  const destination =
    "https://fresh-sumo--local.teddosan.deno.net/api/webhook-ingestion";
  const secret = Deno.env.get("WEBHOOK_SECRET") || "";

  const payload = {
    name: `test-${crypto.randomUUID()}`,
    destination,
    secret,
    subscriptions: { [type]: true },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`External API Error ${response.status}: ${errorText}`);
  }
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  } else {
    // If it's not JSON, just get the text or return a generic success
    const text = await response.text();
    return { success: true, message: text || "Webhook triggered" };
  }
}
