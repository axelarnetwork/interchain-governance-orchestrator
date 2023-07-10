import {
  createAndExport,
  destroyExported,
} from '@axelar-network/axelar-local-dev';

export async function start(
  fundAddresses: string[] = [],
  chains = ['Ethereum', 'Avalanche'],
) {
  await createAndExport({
    chainOutputPath: 'data/chain.json',
    accountsToFund: fundAddresses,
    chains,
    relayInterval: 2000,
  });
}

export async function stop() {
  await destroyExported();
}
