// lib/email.ts
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "Crussader <no-reply@crussader.com>";
const REPLY_TO = process.env.EMAIL_REPLY_TO ?? "soporte@tu-dominio.com";

/**
 * Dominio base para los enlaces que van en los emails.
 *
 * Configura en producción, por ejemplo:
 *  - NEXT_PUBLIC_APP_URL=https://app.crussader.com
 *
 * Fallback final: https://app.crussader.com
 */
const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.APP_URL ??
  process.env.NEXTAUTH_URL ??
  "https://app.crussader.com";

function toAbsoluteUrl(url: string): string {
  if (!url) return APP_BASE_URL;

  // Si ya es absoluta, la dejamos tal cual
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Aseguramos que empiece por "/"
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;

  // Unimos dominio + path sin duplicar barras
  const base = APP_BASE_URL.replace(/\/+$/, "");
  return `${base}${normalizedPath}`;
}

let resendSingleton: Resend | null = null;
function getResend(): Resend | null {
  if (resendSingleton) return resendSingleton;
  if (!RESEND_API_KEY) return null; // ⚠️ sin key -> no instanciar (evita crash en build)
  resendSingleton = new Resend(RESEND_API_KEY);
  return resendSingleton;
}

/** ============ Templates ============ */

const VERIFY_EMAIL_HTML = `<!DOCTYPE html>
<html lang="es">
  <head><meta charset="UTF-8" /><title>Verifica tu cuenta - Crussader</title></head>
  <body style="margin:0; padding:0; background-color:#f9fafb; font-family: Inter, Arial, sans-serif;">
    <table width="100%" cellspacing="0" cellpadding="0" style="background-color:#f9fafb; padding: 40px 0;">
      <tr><td align="center">
        <table width="600" cellspacing="0" cellpadding="0" style="background:white; border-radius:16px; box-shadow:0 4px 12px rgba(0,0,0,0.05); overflow:hidden;">
          <tr><td style="background:linear-gradient(135deg, #7c3aed, #2563eb); padding:24px; text-align:center;">
            <h1 style="margin:0; font-size:28px; color:white; font-weight:700;">¡Bienvenido!</h1>
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

const RESET_EMAIL_HTML = `<!DOCTYPE html>
<html lang="es">
  <head><meta charset="UTF-8" /><title>Restablecer contraseña - Crussader</title></head>
  <body style="margin:0; padding:0; background-color:#f9fafb; font-family: Inter, Arial, sans-serif;">
    <table width="100%" cellspacing="0" cellpadding="0" style="background-color:#f9fafb; padding: 40px 0;">
      <tr><td align="center">
        <table width="600" cellspacing="0" cellpadding="0" style="background:white; border-radius:16px; box-shadow:0 4px 12px rgba(0,0,0,0.05); overflow:hidden;">
          <tr><td style="background:linear-gradient(135deg, #7c3aed, #2563eb); padding:24px; text-align:center;">
            <h1 style="margin:0; font-size:24px; color:white; font-weight:700;">Restablecer contraseña</h1>
          </td></tr>
          <tr><td style="padding:40px 32px; color:#111827; text-align:left;">
            <h2 style="margin-top:0; font-size:20px; font-weight:600; color:#111827;">¿Olvidaste tu contraseña?</h2>
            <p style="font-size:16px; color:#4b5563; line-height:1.6;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>Crussader</strong>.</p>
            <p style="font-size:16px; color:#4b5563; line-height:1.6;">Haz clic en el botón para crear una nueva contraseña. Este enlace es válido durante <strong>1 hora</strong>.</p>
            <table cellspacing="0" cellpadding="0" style="margin:32px auto; text-align:center;">
              <tr><td>
                <a href="{{resetUrl}}" style="background:linear-gradient(135deg, #7c3aed, #2563eb); color:white; text-decoration:none; padding:14px 28px; border-radius:12px; font-size:16px; font-weight:600; display:inline-block;">Restablecer contraseña</a>
              </td></tr>
            </table>
            <p style="font-size:14px; color:#6b7280; line-height:1.6; margin-top:24px;">Si tú no solicitaste este cambio, puedes ignorar este mensaje; tu contraseña seguirá siendo la misma.</p>
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

const BETA_INVITE_HTML = `<!DOCTYPE html>
<html lang="es">
  <head><meta charset="UTF-8" /><title>Invitación beta privada - Crussader</title></head>
  <body style="margin:0; padding:0; background-color:#f9fafb; font-family: Inter, Arial, sans-serif;">
    <table width="100%" cellspacing="0" cellpadding="0" style="background-color:#f9fafb; padding: 40px 0;">
      <tr><td align="center">
        <table width="600" cellspacing="0" cellpadding="0" style="background:white; border-radius:16px; box-shadow:0 4px 12px rgba(0,0,0,0.05); overflow:hidden;">
          <tr><td style="background:linear-gradient(135deg, #7c3aed, #2563eb); padding:24px; text-align:center;">
            <h1 style="margin:0; font-size:24px; color:white; font-weight:700;">Invitación a la beta privada</h1>
          </td></tr>
          <tr><td style="padding:32px 28px; color:#111827; text-align:left;">
            <p style="font-size:16px; color:#4b5563; line-height:1.6;">Hola {{name}},</p>
            <p style="font-size:16px; color:#4b5563; line-height:1.6;">
              Te hemos invitado a probar la beta privada de <strong>Crussader</strong>, la plataforma para centralizar y automatizar las respuestas a reseñas.
            </p>
            <p style="font-size:15px; color:#4b5563; line-height:1.6;">
              Accede con tu código exclusivo y completa el registro desde este enlace:
            </p>
            <table cellspacing="0" cellpadding="0" style="margin:24px 0; text-align:left;">
              <tr><td>
                <a href="{{url}}" style="background:linear-gradient(135deg, #7c3aed, #2563eb); color:white; text-decoration:none; padding:12px 24px; border-radius:999px; font-size:15px; font-weight:600; display:inline-block;">
                  Acceder a la beta
                </a>
              </td></tr>
            </table>
            <p style="font-size:15px; color:#4b5563; line-height:1.6;">
              Código de invitación:
              <strong style="font-family:monospace; font-size:17px;">{{code}}</strong>
            </p>
            <p style="font-size:13px; color:#6b7280; line-height:1.6; margin-top:18px;">
              Si el botón no funciona, copia y pega esta URL en tu navegador:<br />
              <span style="font-family:monospace; font-size:12px; color:#4b5563;">{{url}}</span>
            </p>
          </td></tr>
          <tr><td style="background-color:#f3f4f6; padding:18px; text-align:center; font-size:11px; color:#6b7280;">
            Esta invitación es personal y puede caducar. Si no esperabas este correo, puedes ignorarlo.<br/>
            © 2025 Crussader. Todos los derechos reservados.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;


const ACCESS_REQUEST_HTML = `<!DOCTYPE html>
<html lang="es">
  <head><meta charset="UTF-8" /><title>Solicitud de acceso a tu empresa - Crussader</title></head>
  <body style="margin:0; padding:0; background-color:#f9fafb; font-family: Inter, Arial, sans-serif;">
    <table width="100%" cellspacing="0" cellpadding="0" style="background-color:#f9fafb; padding: 40px 0;">
      <tr><td align="center">
        <table width="600" cellspacing="0" cellpadding="0" style="background:white; border-radius:16px; box-shadow:0 4px 12px rgba(0,0,0,0.05); overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg, #7c3aed, #2563eb); padding:24px; text-align:center;">
              <h1 style="margin:0; font-size:24px; color:white; font-weight:700;">Nueva solicitud de acceso</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px; color:#111827; text-align:left;">
              <p style="font-size:16px; color:#4b5563; line-height:1.6;">
                Hola,
              </p>
              <p style="font-size:16px; color:#4b5563; line-height:1.6;">
                <strong>{{requesterName}}</strong> (<a href="mailto:{{requesterEmail}}" style="color:#2563eb; text-decoration:none;">{{requesterEmail}}</a>)
                ha solicitado unirse a vuestra empresa en <strong>Crussader</strong>.
              </p>
              <p style="font-size:15px; color:#4b5563; line-height:1.6; margin-top:16px;">
                Si reconoces a esta persona y quieres que forme parte de tu cuenta, aprueba el acceso desde el siguiente botón.
              </p>

              <table cellspacing="0" cellpadding="0" style="margin:28px 0; text-align:center; width:100%;">
                <tr><td align="center">
                  <a href="{{approveUrl}}"
                     style="background:linear-gradient(135deg, #7c3aed, #2563eb); color:white; text-decoration:none; padding:14px 30px; border-radius:999px; font-size:15px; font-weight:600; display:inline-block;">
                    Aprobar acceso
                  </a>
                </td></tr>
              </table>

              <p style="font-size:13px; color:#6b7280; line-height:1.6;">
                Si no conoces a esta persona o no quieres concederle acceso, simplemente ignora este mensaje y no se realizará ningún cambio en tu cuenta.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f3f4f6; padding:18px; text-align:center; font-size:11px; color:#6b7280;">
              Este mensaje se ha enviado porque alguien ha indicado que formas parte del equipo de tu empresa en Crussader.<br/>
              © 2025 Crussader. Todos los derechos reservados.
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

/** ============ Sender helpers ============ */

async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing — email suppressed", {
      to,
      subject,
    });
    return { id: "noop", suppressed: true } as const;
  }
  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [to],
    subject,
    html,
    text,
    headers: { "Reply-To": REPLY_TO },
  });
  if (error) throw new Error((error as any)?.message ?? "RESEND_SEND_ERROR");
  return data;
}

/** ============ Public API ============ */

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  const absoluteVerifyUrl = toAbsoluteUrl(verifyUrl);

  const html = VERIFY_EMAIL_HTML.replace(/{{verifyUrl}}/g, absoluteVerifyUrl);
  const text = `Crussader

Verifica tu cuenta para activarla:
${absoluteVerifyUrl}

Si no has solicitado esta cuenta, ignora este mensaje.`;
  return sendEmail({
    to,
    subject: "Verifica tu cuenta - Crussader",
    html,
    text,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
) {
  const absoluteResetUrl = toAbsoluteUrl(resetUrl);

  const html = RESET_EMAIL_HTML.replace(/{{resetUrl}}/g, absoluteResetUrl);
  const text = `Crussader

Recibimos una solicitud para restablecer tu contraseña.
Abre este enlace (válido 1 hora) para crear una nueva:
${absoluteResetUrl}

Si no solicitaste este cambio, ignora este mensaje.`;
  return sendEmail({
    to,
    subject: "Restablecer contraseña - Crussader",
    html,
    text,
  });
}

/** ============ Send Invitation email ============ */

export async function sendBetaInviteEmail(params: {
  to: string;
  name: string;
  code: string;
  url: string;
}) {
  const safeName = params.name || params.to;
  const absoluteUrl = toAbsoluteUrl(params.url);

  const html = BETA_INVITE_HTML
    .replace(/{{name}}/g, safeName)
    .replace(/{{code}}/g, params.code)
    .replace(/{{url}}/g, absoluteUrl);

  const text = `Hola ${safeName},

Te hemos invitado a la beta privada de Crussader.

Accede desde este enlace:
${absoluteUrl}

Código de invitación: ${params.code}

Si no esperabas este correo, puedes ignorarlo.`;

  return sendEmail({
    to: params.to,
    subject: "Invitación beta privada - Crussader",
    html,
    text,
  });
}

/** ============ Access request email (onboarding) ============ */

export async function sendAccessRequestEmail(params: {
  to: string;              // <- AHORA es un solo email
  requesterName: string;
  requesterEmail: string;
  approveUrl: string;
}) {
  const { to, requesterName, requesterEmail, approveUrl } = params;

  const safeName =
    typeof requesterName === "string" && requesterName.trim().length > 0
      ? requesterName.trim()
      : "Usuario";

  const safeEmail =
    typeof requesterEmail === "string" && requesterEmail.trim().length > 0
      ? requesterEmail.trim()
      : "desconocido@correo.com";

  const absoluteApproveUrl = toAbsoluteUrl(approveUrl);

  const html = ACCESS_REQUEST_HTML
    .replace(/{{requesterName}}/g, safeName)
    .replace(/{{requesterEmail}}/g, safeEmail)
    .replace(/{{approveUrl}}/g, absoluteApproveUrl);

  const text = `Nueva solicitud de acceso en Crussader.

${safeName} (${safeEmail}) ha solicitado unirse a vuestra empresa.

Si quieres aprobar el acceso, abre este enlace:
${absoluteApproveUrl}

Si no reconoces a esta persona, puedes ignorar este mensaje.`;

  return sendEmail({
    to,
    subject: "Nueva solicitud de acceso a tu empresa - Crussader",
    html,
    text,
  });
}
