"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { broadcastQueryClient } from "@tanstack/query-broadcast-client-experimental";

type Props = { children: ReactNode };

export default function QueryProvider({ children }: Props) {
  const [client] = useState(() => {
    const qc = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 min “fresco”
          gcTime: 60 * 60 * 1000,   // 1h en caché
          refetchOnWindowFocus: false,
          retry: 1,
        },
      },
    });

    // Broadcast multi-tab
    broadcastQueryClient({ queryClient: qc, broadcastChannel: "crussader-cache" });
    return qc;
  });

  // Persistencia en localStorage (podemos migrar a IndexedDB más tarde)
  const persister =
    typeof window !== "undefined"
      ? createSyncStoragePersister({ storage: window.localStorage })
      : undefined;

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister: persister!,
        maxAge: 24 * 60 * 60 * 1000, // 24h
      }}
    >
      <QueryClientProvider client={client}>
        {children}
        {process.env.NODE_ENV === "development" ? (
          <ReactQueryDevtools initialIsOpen={false} />
        ) : null}
      </QueryClientProvider>
    </PersistQueryClientProvider>
  );
}
