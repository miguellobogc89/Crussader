import { Role } from "@prisma/client"

export type NotificationChannel = "dashboard" | "email" | "whatsapp"

interface NotificationRule {
  channels: NotificationChannel[]
  roles?: Role[]
  enabled?: boolean
}

type NotificationType = "review_created" | "user_created" // Aquí irán todos los tipos

type NotificationRulesConfig = {
  [key in NotificationType]: NotificationRule
}

export const notificationRules: NotificationRulesConfig = {
  review_created: {
    channels: ["dashboard", "email", "whatsapp"], // aún sin roles definidos
  },
  user_created: {
    channels: ["dashboard"],
  },
}
