// lib/email.ts
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Crussader <no-reply@crussader.com>";

let resendSingleton: Resend | null = null;
function getResend(): Resend | null {
  if (resendSingleton) return resendSingleton;
  if (!RESEND_API_KEY) return null;            // ⚠️ sin key -> no instanciar (evita crash en build)
  resendSingleton = new Resend(RESEND_API_KEY);
  return resendSingleton;
}

const VERIFY_EMAIL_HTML = `<!DOCTYPE html>
<html lang="es">
  <head><meta charset="UTF-8" /><title>Verifica tu cuenta - Crussader</title></head>
  <body style="margin:0; padding:0; background-color:#f9fafb; font-family: Inter, Arial, sans-serif;">
    <table width="100%" cellspacing="0" cellpadding="0" style="background-color:#f9fafb; padding: 40px 0;">
      <tr><td align="center">
        <table width="600" cellspacing="0" cellpadding="0" style="background:white; border-radius:16px; box-shadow:0 4px 12px rgba(0,0,0,0.05); overflow:hidden;">
          <tr><td style="background:linear-gradient(135deg, #7c3aed, #2563eb); padding:24px; text-align:center;">
            <h1 style="margin:0; font-size:28px; color:white; font-weight:700;">Crussader</h1>
          </td></tr>
          <tr><td style="padding:40px 32px; color:#111827; text-align:left;">
            <h2 style="margin-top:0; font-size:22px; font-weight:600; color:#111827;">Verifica tu correo electrónico</h2>
            <p style="font-size:16px; color:#4b5563; line-height:1.6;">¡Bienvenido a <strong>Crussader</strong>! Para activar tu cuenta necesitamos que confirmes tu correo electrónico.</p>
            <p style="font-size:16px; color:#4b5563; line-height:1.6;">Haz clic en el siguiente botón para completar la verificación:</p>
            <table cellspacing="0" cellpadding="0" style="margin:32px auto; text-align:center;">
              <tr><td>
                <a href="{{verifyUrl}}" style="background:linear-gradient(135deg, #7c3aed, #2563eb); color:white; text-decoration:none; padding:14px 28px; border-radius:12px; font-size:16px; font-weight:600; display:inline-block;">Verificar cuenta</a>
              </td></tr>
            </table>
            <p style="font-size:14px; color:#6b7280; line-height:1.6; margin-top:24px;">Si no creaste una cuenta en Crussader, puedes ignorar este mensaje.</p>
          </td></tr>
          <tr><td style="background-color:#f3f4f6; padding:20px; text-align:center; font-size:12px; color:#6b7280;">
            © 2025 Crussader. Todos los derechos reservados.<br />
            <a href="https://crussader.com" style="color:#7c3aed; text-decoration:none;">Visítanos</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  const resend = getResend();

  const html = VERIFY_EMAIL_HTML.replace(/{{verifyUrl}}/g, verifyUrl);
  const text = `Crussader

Verifica tu cuenta para activarla:
${verifyUrl}

Si no has solicitado esta cuenta, ignora este mensaje.`;

  if (!resend) {
    // No rompas build ni runtime si falta la key: no-op con aviso
    console.warn("[email] RESEND_API_KEY missing — email suppressed", { to, subject: "Verifica tu cuenta - Crussader" });
    return { id: "noop", suppressed: true } as const;
  }

  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [to],
    subject: "Verifica tu cuenta - Crussader",
    html,
    text,
    headers: { "Reply-To": "soporte@tu-dominio.com" },
  });

  if (error) throw new Error((error as any)?.message ?? "RESEND_SEND_ERROR");
  return data;
}
