import { pool } from "../../utils/db.ts";
import { Handlers } from "$fresh/server.ts";

async function handleSync(_req: Request) {
  try {
    const { bashoId } = await _req.json();

    await pool.query(
      `INSERT INTO site_settings (key, value)
       VALUES ('current_basho', $1) 
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [bashoId],
    );

    console.log(`Current basho set to ${bashoId}`);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error setting current basho:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 },
    );
  }
}

export const handler: Handlers = {
  async POST(req) {
    console.log("Starting Banzuke Sync...");

    try {
      const result = await handleSync(req);

      return new Response(
        JSON.stringify({
          success: true,
          count: result.count,
          message: "Status updated successfully",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (err) {
      return new Response(
        JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : "Internal Server Error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
