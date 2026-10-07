import { defineChain } from "@reown/appkit/networks";
import { ARC_MAINNET_EXPLORER_URL, ARC_MAINNET_RPC_URL, arcMainnetAddChainParameter } from "./arc-mainnet-config";

export const arcMainnet = defineChain({
  id: 5042,
  caipNetworkId: "eip155:5042",
  chainNamespace: "eip155",
  name: "Arc Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "USDC",
    symbol: "USDC",
  },
  rpcUrls: {
    default: {
      http: [ARC_MAINNET_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: "Arc Explorer",
      url: ARC_MAINNET_EXPLORER_URL,
    },
  },
});

export { arcMainnetAddChainParameter };
