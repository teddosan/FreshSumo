// routes/api/webhook-ingestion.ts
import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async POST(req, _ctx) {
    try {
      // 1. Get the raw body for signature verification if needed
      const bodyText = await req.text();
      const data = JSON.parse(bodyText);
      console.log("Raw body text:", bodyText); // Debug: Log the raw body text
      console.log("Parsed JSON data:", data); // Debug: Log the parsed JSON data

      // 2. Security Check: Verify the signature header
      // (Assuming the API sends an HMAC-SHA256 signature in the headers)
      const signature = req.headers.get("x-hub-signature-256");
      if (!signature) {
        console.log("Missing signature header");
        return new Response("Missing signature", { status: 401 });
      }

      // Logic to verify 'signature' using your 'secret' and 'bodyText' goes here

      // 3. Process the 202311 Basho data
      console.log("Received dataset from November 2023 tournament:", data);

      // Example: Insert into your PostgreSQL database
      // await db.queryArray("INSERT INTO basho_results (data) VALUES ($1)", [data]);

      return new Response(JSON.stringify({ status: "success" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Webhook processing failed:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};
