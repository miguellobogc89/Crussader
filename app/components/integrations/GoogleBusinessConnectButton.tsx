// app/components/integrations/GoogleBusinessConnectButton.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { useBootstrapData } from "@/app/providers/bootstrap-store";

export default function GoogleBusinessConnectButton({
  children = "Conectar con Google Business",
}: {
  children?: string;
}) {
  const boot = useBootstrapData();
  const activeCompanyId = boot?.activeCompany?.id ?? null;

  const [loading, setLoading] = useState(false);

  function handleConnect() {
    if (!activeCompanyId) {
      console.warn("[GoogleConnect] No active company found");
      return;
    }

    setLoading(true);

    const returnTo =
      typeof window !== "undefined"
        ? window.location.pathname
        : "/dashboard/mybusiness";

    const url = new URL(
      "/api/integrations/google/business-profile/connect",
      window.location.origin
    );

    url.searchParams.set("companyId", activeCompanyId);
    url.searchParams.set("returnTo", returnTo);

    window.location.href = url.toString();
  }

  const disabled = loading || !activeCompanyId;

  return (
    <button
      onClick={handleConnect}
      disabled={disabled}
      className={[
        "inline-flex items-center gap-2 px-4 py-2 rounded-xl",
        "border border-slate-300 bg-white text-slate-700",
        "hover:bg-slate-900 hover:text-white hover:border-slate-900",
        "transition-colors duration-200",
        disabled ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <Image
        src="/platform-icons/google-business.png"
        alt="Google Business"
        width={18}
        height={18}
      />

      <span className="text-sm font-medium">
        {loading ? "Conectando..." : children}
      </span>
    </button>
  );
}
