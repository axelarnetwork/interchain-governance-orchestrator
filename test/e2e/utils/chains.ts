import fs from 'fs';

export function getChains() {
  const _chains = fs.readFileSync('data/chain.json', 'utf8');
  return JSON.parse(_chains);
}
