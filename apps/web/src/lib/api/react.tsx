"use client";

import { createContext, useContext, useMemo } from "react";
import type { ApiClient } from "./client";
import { getApiMode } from "./client";
import { createHttpApiClient } from "./http";
import { createMockApiClient } from "./mock";

const ApiContext = createContext<ApiClient | null>(null);

export function ApiProvider({
  children,
  mode,
}: {
  children: React.ReactNode;
  mode?: "mock" | "http";
}) {
  const client = useMemo(() => {
    const m = mode ?? getApiMode();
    return m === "http" ? createHttpApiClient() : createMockApiClient();
  }, [mode]);

  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}

export function useApi() {
  const v = useContext(ApiContext);
  if (!v) throw new Error("ApiProvider is missing");
  return v;
}

