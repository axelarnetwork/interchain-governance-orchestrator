import { createAndExport } from "@axelar-network/axelar-local-dev";

export async function start(fundAddresses: string[] = []) {
  await createAndExport({
    chainOutputPath: "data/chain.json",
    accountsToFund: fundAddresses,
    chains: ["Ethereum", "Avalanche"],
    relayInterval: 5000,
  });
}
