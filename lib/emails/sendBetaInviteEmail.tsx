import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

type Params = {
  to: string;
  code: string;
  url: string;
  name?: string;
};

export async function sendBetaInviteEmail({ to, code, url, name }: Params) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[sendBetaInviteEmail] RESEND_API_KEY no configurado");
    return;
  }

  const subject = "Invitación a la beta privada de Crussader";
  const displayName = name || to;

  await resend.emails.send({
    from: "Crussader <no-reply@crussader.app>",
    to,
    subject,
    react: (
      <div
        style={{
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: "14px",
          color: "#0f172a",
          lineHeight: 1.6,
        }}
      >
        <p>Hola {displayName},</p>
        <p>
          Te hemos invitado a probar la beta privada de <strong>Crussader</strong>, la plataforma
          para centralizar y automatizar las respuestas a reseñas.
        </p>
        <p>
          Para activar tu acceso, entra en el siguiente enlace e introduce tu código de invitación:
        </p>
        <p>
          <a
            href={url}
            style={{
              display: "inline-block",
              padding: "10px 18px",
              borderRadius: "999px",
              background:
                "linear-gradient(90deg, #4f46e5, #8b5cf6)",
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Acceder a la beta
          </a>
        </p>
        <p>
          Código de invitación:{" "}
          <strong
            style={{
              fontFamily: "monospace",
              fontSize: "16px",
            }}
          >
            {code}
          </strong>
        </p>
        <p style={{ color: "#6b7280", fontSize: "12px", marginTop: "16px" }}>
          Si el botón no funciona, copia y pega esta URL en tu navegador:
          <br />
          <span style={{ fontFamily: "monospace" }}>{url}</span>
        </p>
        <p style={{ color: "#9ca3af", fontSize: "11px", marginTop: "12px" }}>
          Esta invitación es personal y puede caducar. Si tienes cualquier problema, responde a este correo.
        </p>
      </div>
    ),
  });
}
