"use client";

import { motion, type Variants } from "framer-motion";
import IntegrationPlatformCard, { type Provider } from "@/app/components/integrations/IntegrationPlatformCard";

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1], // cubic-bezier "easeOut" equivalente
    },
  },
};

export default function IntegrationsGridClient({ providers }: { providers: Provider[] }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {providers.map((p) => (
        <motion.div key={p.key} variants={item}>
          <IntegrationPlatformCard provider={p} />
        </motion.div>
      ))}
    </motion.div>
  );
}
