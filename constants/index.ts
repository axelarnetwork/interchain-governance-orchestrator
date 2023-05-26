import { chains } from "./chains";
import testnetChains from "@axelar-network/axelar-cgp-solidity/info/testnet.json";
import mainnetChains from "@axelar-network/axelar-cgp-solidity/info/mainnet.json";

export const contracts = {
  [chains.ethereum]: {
    gateway: testnetChains[0].gateway,
    gasService: testnetChains[0].gasReceiver,
  },
  [chains.avalanche]: {
    gateway: testnetChains[1].gateway,
    gasService: testnetChains[1].gasReceiver,
  },
  [chains.fantom]: {
    gateway: testnetChains[2].gateway,
    gasService: testnetChains[2].gasReceiver,
  },
  [chains.polygon]: {
    gateway: testnetChains[3].gateway,
    gasService: testnetChains[3].gasReceiver,
  },
  [chains.moonbeam]: {
    gateway: testnetChains[4].gateway,
    gasService: testnetChains[4].gasReceiver,
  },
  [chains.hardhat]: {
    gateway: mainnetChains[0].gateway,
    gasService: mainnetChains[0].gasReceiver,
  },
};
