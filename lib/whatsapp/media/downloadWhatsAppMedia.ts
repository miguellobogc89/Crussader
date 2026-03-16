// lib/whatsapp/media/downloadWhatsAppMedia.ts
import fs from "fs/promises";
import os from "os";
import path from "path";

type DownloadWhatsAppMediaArgs = {
  mediaId?: string | null;
  mediaUrl?: string | null;
  extension?: string | null;
};

export async function downloadWhatsAppMedia(args: DownloadWhatsAppMediaArgs) {
  const token = process.env.WHATSAPP_PERMANENT_TOKEN;

  if (!token) {
    throw new Error("WHATSAPP_PERMANENT_TOKEN missing");
  }

  const mediaId = args.mediaId ?? null;
  const directUrl = args.mediaUrl ?? null;
  const extension = args.extension ?? "ogg";

  let finalUrl = directUrl;

  if (!finalUrl) {
    if (!mediaId) {
      throw new Error("Missing mediaId and mediaUrl");
    }

    const metaRes = await fetch(
      `https://graph.facebook.com/v19.0/${mediaId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const rawMetaText = await metaRes.text();

    let metaJson: any = null;

    try {
      metaJson = rawMetaText ? JSON.parse(rawMetaText) : null;
    } catch {
      metaJson = null;
    }

    if (!metaRes.ok) {
      throw new Error(
        `Meta media lookup failed: ${metaRes.status} ${rawMetaText}`
      );
    }

    if (!metaJson?.url) {
  throw new Error(`Media URL not returned from Meta: ${rawMetaText}`);
}

finalUrl = metaJson.url;
}

if (!finalUrl) {
  throw new Error("Resolved media URL is empty");
}

const mediaRes = await fetch(finalUrl, {
  headers: {
    Authorization: `Bearer ${token}`
  }
});

  if (!mediaRes.ok) {
    const rawMediaText = await mediaRes.text();
    throw new Error(
      `Media download failed: ${mediaRes.status} ${rawMediaText}`
    );
  }

  const buffer = Buffer.from(await mediaRes.arrayBuffer());
  const fileKey = mediaId ?? `wa_media_${Date.now()}`;
  const filePath = path.join(os.tmpdir(), `${fileKey}.${extension}`);

  await fs.writeFile(filePath, buffer);

  return filePath;
}