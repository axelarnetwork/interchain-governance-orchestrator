import 'dotenv/config';
import 'hardhat-deploy';
import { ethers } from 'ethers';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
// Even hardhat-chai-matchers has already imported in the toolbox,
// we still need to import it here so that vscode can recognize the types
import '@nomicfoundation/hardhat-chai-matchers';
import {
  importNetworks,
  readJSON,
} from '@axelar-network/axelar-contract-deployments/evm/utils';
import testnetChains from '@axelar-network/axelar-contract-deployments/info/testnet.json';
import mainnetChains from '@axelar-network/axelar-contract-deployments/info/mainnet.json';
import './tasks';

const keys = readJSON('./info/keys.json');
const env = process.env.ENV || 'testnet';
const isE2E = process.env.E2E === 'true' ? true : false;
const chains = env === 'testnet' ? testnetChains : mainnetChains;
const { networks, etherscan } = importNetworks(chains, keys);

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  solidity: {
    version: '0.8.19',
    settings: {
      evmVersion: process.env.EVM_VERSION || 'london',
      optimizer: {
        enabled: true,
        runs: 1000000,
        details: {
          peephole: process.env.COVERAGE === undefined,
          inliner: process.env.COVERAGE === undefined,
          jumpdestRemover: true,
          orderLiterals: true,
          deduplicate: true,
          cse: process.env.COVERAGE === undefined,
          constantOptimizer: true,
          yul: true,
          yulDetails: {
            stackAllocation: true,
          },
        },
      },
    },
  },
  networks: {
    ...networks,
    hardhat: {
      forking: {
        enabled: !isE2E,
        url: networks['ethereum'].url,
      },
    },
  },
  etherscan,
  deterministicDeployment: (network: string) => {
    return {
      deployer: new ethers.Wallet(keys.accounts[0]).address,
      factory: '',
      funding: '',
      signedTx: '',
    };
  },
  typechain: {
    target: 'ethers-v5',
  },
};

export default config;
