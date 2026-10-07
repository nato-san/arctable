"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { type AppKitNetwork } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { WagmiProvider } from "wagmi";
import { useState, type ReactNode } from "react";
import { arcMainnet } from "@/lib/arc-mainnet";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "434fa47a55f3bb28ce97e587b7ce5c00";
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [arcMainnet as AppKitNetwork];
const appUrl = typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:3000";

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  defaultNetwork: arcMainnet as AppKitNetwork,
  metadata: {
    name: "ArcTable",
    description: "Table ordering with Arc USDC settlement",
    url: appUrl,
    icons: [],
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
    swaps: false,
    onramp: false,
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
