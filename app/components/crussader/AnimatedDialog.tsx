// app/components/crussader/AnimatedDialog.tsx
"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

export default function AnimatedDialog({
  open,
  onOpenChange,
  title,
  children,
  contentClassName = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={["p-0 overflow-hidden", contentClassName].join(" ")}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="animated-dialog"
              initial={{ opacity: 0, y: 8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.99 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="p-6"
            >
              <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
              </DialogHeader>

              <div className="mt-4">{children}</div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
