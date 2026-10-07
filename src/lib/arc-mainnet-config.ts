export const ARC_MAINNET_CHAIN_ID = 5042;
export const ARC_MAINNET_CHAIN_ID_HEX = "0x13b2";
export const ARC_MAINNET_RPC_URL = "https://rpc.mainnet.arc.io";
export const ARC_MAINNET_EXPLORER_URL = "https://explorer.arc.io";

export const arcMainnetAddChainParameter = {
  chainId: ARC_MAINNET_CHAIN_ID_HEX,
  chainName: "Arc Mainnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: [ARC_MAINNET_RPC_URL],
  blockExplorerUrls: [ARC_MAINNET_EXPLORER_URL],
};
