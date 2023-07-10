const testnetChains = require("@axelar-network/axelar-contract-deployments/info/testnet.json")
const mainnetChains = require("@axelar-network/axelar-contract-deployments/info/mainnet.json")

const env = process.env.ENV || "testnet"
const { chains } = env === "testnet" ? testnetChains : mainnetChains

const contracts = Object.keys(chains).reduce(
  (acc, chainKey) => {
    acc[chainKey] = {
      gateway: chains[chainKey].contracts.AxelarGateway.address,
      gasService: chains[chainKey].contracts.AxelarGasService.address
    }
    return acc
  },
  {
    hardhat: {
      gateway: chains.ethereum.contracts.AxelarGateway.address,
      gasService: chains.ethereum.contracts.AxelarGasService.address
    }
  }
)

module.exports = {
  contracts
}
