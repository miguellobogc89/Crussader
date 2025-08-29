import { templates } from "./templates";
import type { TemplateId, TemplateInput } from "../types";

export function buildPrompt(templateId: TemplateId, input: TemplateInput) {
  const tpl = templates[templateId] ?? templates["default-v1"];
  return tpl(input);
}
