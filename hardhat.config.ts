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


// TODO: Remove once exist in testnet.json file.
const filecoin =
  env === 'testnet'
    ? {
        chainId: 314159,
        id: 'filecoin-2',
        url: 'https://api.calibration.node.glif.io/rpc/v1',
        accounts: keys?.accounts || [],
      }
    : mainnetChains.chains.filecoin;

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000,
      },
    },
  },
  networks: {
    ...networks,
    filecoin,
    hardhat: {
      forking: {
        enabled: !isE2E,
        url: networks['ethereum'].url,
      },
    },
  },
  etherscan,
  deterministicDeployment: (network: string) => {
    // if (network === 'filecoin') {
    //   return {
    //     deployer: new ethers.Wallet(keys.accounts[0]).address,
    //     factory: '0x25DDFB4dc877f98ED3E00b6D1dAD3810c51DB849',
    //     funding: '10000000000000000',
    //     signedTx: '0xf8a78085174876e800830186a08080b853604580600e600039806000f350fe7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf382f4f5a01ea073da86af6d8a8215f0fe8986181c291d61dcaab557895f12d22c16764d77a04fd5bc7be48eac759e8afbbe6c7de973ae4d12755638a0a3c5a48bd22cfd1e0b',
    //   };
    // }
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
