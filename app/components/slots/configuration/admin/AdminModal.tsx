// app/components/slots/configuration/Admin/AdminModal.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { X } from "lucide-react";
import { AdminEmployeesTab } from "./AdminEmployeesTab";
import { AdminClientsTab } from "./AdminClientsTab";

type AdminModalProps = {
  open: boolean;
  onClose: () => void;
  locationId: string;
};

export function AdminModal({
  open,
  onClose,
  locationId,
}: AdminModalProps) {
  const [tab, setTab] = useState<"employees" | "clients">("employees");

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          className="mx-auto mt-10 w-full max-w-6xl px-4"
        >
          <div className="overflow-hidden rounded-[28px] border bg-white shadow-xl">
            {/* header */}
            <div className="flex items-center justify-between border-b px-6 py-5">
              <h2 className="text-lg font-semibold">Administración</h2>

              <button onClick={onClose}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* tabs */}
            <div className="border-b px-6 pt-4">
              <div className="flex gap-2">
                <button onClick={() => setTab("employees")}>
                  Empleados
                </button>
                <button onClick={() => setTab("clients")}>
                  Clientes
                </button>
              </div>
            </div>

            {/* content */}
            <div className="p-6">
              {tab === "employees" && (
                <AdminEmployeesTab locationId={locationId} />
              )}

              {tab === "clients" && <AdminClientsTab />}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}