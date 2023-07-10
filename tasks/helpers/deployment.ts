import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  readJSON,
} from "@axelar-network/axelar-contract-deployments/evm/utils";
import path from 'path'

export function getDeploymentAddress(hre: HardhatRuntimeEnvironment, contractName: string, chainName: string) {
  try{
  const contract = readJSON(path.join(__dirname, `../../deployments/${chainName}/${contractName}.json`))
  return contract?.address
  } catch (e) {
    return undefined
  }
}

export function getInterchainProposalSenderAddress(chainName: string) {
  try{
    const contract = readJSON(path.join(__dirname, "../../deployed.json"))
    const env = process.env.ENV === "mainnet" ? "mainnet" : "testnet";
    return contract["InterchainProposalSender"][env][chainName]
    } catch (e) {
      return undefined
    }
}
