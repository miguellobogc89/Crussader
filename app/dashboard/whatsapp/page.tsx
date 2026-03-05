// app/dashboard/whatsapp/page.tsx
import { redirect } from "next/navigation";

export default function WhatsAppIndex() {
  redirect("/dashboard/whatsapp/chat");
}