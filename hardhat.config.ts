import "dotenv/config";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-verify";
import "./tasks/whitelistProposalSender";
import "./tasks/whitelistProposalCaller";
import { ethers } from "ethers";

const privateKey = process.env.PRIVATE_KEY || "";
const accounts = [privateKey];
const apiKey = {
  ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY || "",
  SNOWTRACE_API_KEY: process.env.SNOWTRACE_API_KEY || "",
  MOONSCAN_API_KEY: process.env.MOONSCAN_API_KEY || "",
  MUMBAISCAN_API_KEY: process.env.MUMBAISCAN_API_KEY || "",
  FTMSCAN_API_KEY: process.env.FTMSCAN_API_KEY || "",
};
const isE2E = process.env.E2E === "true" ? true : false;

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      forking: {
        enabled: !isE2E,
        url: `https://rpc.ankr.com/eth_goerli`,
      },
    },
    ethereum: {
      chainId: 5,
      gasMultiplier: 2,
      url: "https://rpc.ankr.com/eth_goerli",
      accounts,
    },
    avalanche: {
      chainId: 43113,
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts,
    },
    moonbeam: {
      chainId: 1287,
      url: "https://rpc.api.moonbase.moonbeam.network",
      accounts,
    },
    polygon: {
      chainId: 80001,
      url: "https://rpc-mumbai.maticvigil.com/",
      accounts,
    },
    fantom: {
      chainId: 4002,
      url: "https://rpc.testnet.fantom.network",
      accounts,
    },
  },
  etherscan: {
    apiKey: {
      goerli: apiKey.ETHERSCAN_API_KEY,
      avalancheFujiTestnet: apiKey.SNOWTRACE_API_KEY,
      moonbaseAlpha: apiKey.MOONSCAN_API_KEY,
      polygonMumbai: apiKey.MUMBAISCAN_API_KEY,
      ftmTestnet: apiKey.FTMSCAN_API_KEY,
    },
  },
  deterministicDeployment: (network: string) => {
    return {
      deployer: new ethers.Wallet(privateKey).address,
      factory: "",
      funding: "",
      signedTx: "",
    };
  },
  typechain: {
    target: "ethers-v5",
  },
};

export default config;
