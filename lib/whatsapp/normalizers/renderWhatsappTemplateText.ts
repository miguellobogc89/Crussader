// lib/slots/whatsapp/normalizers/renderWhatsappTemplateText.ts

export function renderWhatsappTemplateText(
  bodyPreview: string,
  params: unknown[],
) {
  let output = bodyPreview;

  params.forEach((value, index) => {
    const n = index + 1;

    output = output.replace(
      new RegExp(`\\{\\{\\s*${n}\\s*\\}\\}`, "g"),
      String(value ?? ""),
    );
  });

  return output;
}