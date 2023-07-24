import testnetChains from '@axelar-network/axelar-contract-deployments/info/testnet.json';
import mainnetChains from '@axelar-network/axelar-contract-deployments/info/mainnet.json';

const env = process.env.ENV || 'testnet';

// TODO: Remove once exist in testnet.json file.
testnetChains.chains.filecoin = {
  id: "filecoin-2",
  contracts: {
    AxelarGateway: {
      address: '0x999117D44220F33e0441fbAb2A5aDB8FF485c54D',
    },
    AxelarGasService: {
      address: '0xbE406F0189A0B4cf3A05C286473D23791Dd44Cc6',
    },
    Create3Deployer: {
      address: "0x69eC5352f15aE9b9F3B462dBbF9726F22ED273a4"
    }
  },
};

const { chains } = env === 'mainnet' ?  mainnetChains : testnetChains;

export const contracts = Object.keys(chains).reduce(
  (acc: any, chainKey: string) => {
    acc[chainKey] = {
      id: chains[chainKey].id,
      gateway: chains[chainKey].contracts.AxelarGateway.address,
      gasService: chains[chainKey].contracts.AxelarGasService.address,
      create3Deployer: chains[chainKey].contracts.Create3Deployer?.address,
    };
    return acc;
  },
  {
    hardhat: {
      gateway: chains.ethereum.contracts.AxelarGateway.address,
      gasService: chains.ethereum.contracts.AxelarGasService.address,
      create3Deployer: undefined,
    },
  },
);
