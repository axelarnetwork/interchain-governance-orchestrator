import "dotenv/config";
import "hardhat-deploy";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-chai-matchers";
import "solidity-coverage";
import "./tasks";
import { ethers } from "ethers";
import { HardhatUserConfig } from "hardhat/config";
import {
  importNetworks,
  readJSON,
} from "@axelar-network/axelar-contract-deployments/evm/utils";
import testnetChains from "@axelar-network/axelar-contract-deployments/info/testnet.json";
import mainnetChains from "@axelar-network/axelar-contract-deployments/info/mainnet.json";

const keys = readJSON("./info/keys.json");
const env = process.env.ENV || "testnet";
const isE2E = process.env.E2E === "true" ? true : false;
const chains = env === "testnet" ? testnetChains : mainnetChains;
const { networks, etherscan } = importNetworks(chains, keys);

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000,
      },
    },
  },
  networks: {
    ...networks,
    hardhat: {
      forking: {
        enabled: !isE2E,
        url: networks["ethereum"].url,
      },
    },
  },
  etherscan,
  deterministicDeployment: (network: string) => {
    return {
      deployer: new ethers.Wallet(keys.accounts[0]).address,
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
