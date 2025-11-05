import { NextRequest, NextResponse } from "next/server";

const APP_ID = process.env.IG_APP_ID!;
const APP_SECRET = process.env.IG_APP_SECRET!;

// ⚙️ Endpoint: /api/instagram/callback
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  try {
    // Paso 1️⃣: Intercambiar el "code" por un token corto (1h)
    const tokenRes = await fetch(
      `https://api.instagram.com/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: APP_ID,
          client_secret: APP_SECRET,
          grant_type: "authorization_code",
          redirect_uri: "https://crussader.vercel.app/api/instagram/callback",
          code,
        }),
      }
    );

    const data = await tokenRes.json();

    // data.access_token → token de usuario
    // data.user_id → id del usuario

    console.log("✅ Instagram connected:", data);
    return NextResponse.redirect(
      "https://crussader.vercel.app/connections?connected=instagram"
    );
  } catch (err) {
    console.error("❌ Error Instagram callback:", err);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}
