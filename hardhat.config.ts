import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "hardhat-deploy";
import "@nomicfoundation/hardhat-verify";

const privateKey = process.env.privateKey || "";
const apiKey = {
  ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY || "",
  SNOWTRACE_API_KEY: process.env.SNOWTRACE_API_KEY || "",
  MOONSCAN_API_KEY: process.env.MOONSCAN_API_KEY || "",
  MUMBAISCAN_API_KEY: process.env.MUMBAISCAN_API_KEY || "",
  FTMSCAN_API_KEY: process.env.FTMSCAN_API_KEY || "",
};

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    ethereum: {
      chainId: 5,
      gasMultiplier: 2,
      url: "https://goerli.infura.io/v3/a3a667b533f34fd48ca350546454ea05",
      accounts: [privateKey],
    },
    avalanche: {
      chainId: 43113,
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: [privateKey],
    },
    moonbeam: {
      chainId: 1287,
      url: "https://rpc.api.moonbase.moonbeam.network",
      accounts: [privateKey],
    },
    polygon: {
      chainId: 80001,
      url: "https://rpc-mumbai.maticvigil.com/",
      accounts: [privateKey],
    },
    fantom: {
      chainId: 4002,
      url: "https://rpc.testnet.fantom.network",
      accounts: [privateKey],
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
};

export default config;
