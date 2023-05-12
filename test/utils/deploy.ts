import { Wallet } from "ethers";
import { ethers } from "hardhat";
import { getChains } from "./chains";

export async function deploy(
  wallet: Wallet,
  rpcUrl: string,
  contractName: string,
  contractArgs: string[]
) {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const signer = wallet.connect(provider);
  const contract = await ethers.getContractFactory(contractName, signer);
  return contract.deploy(...contractArgs);
}

export function deployInterchainProposalSender(deployer: Wallet) {
  const chains = getChains();
  return deploy(deployer, chains[0].rpc, "InterchainProposalSender", [
    chains[0].gateway,
    chains[0].gasService,
  ]);
}

export function deployInterchainProposalExecutor(deployer: Wallet) {
  const chains = getChains();
  return deploy(deployer, chains[1].rpc, "InterchainProposalExecutor", [
    chains[1].gateway,
  ]);
}

export function deployDummyProposalExecutor(deployer: Wallet) {
  const chains = getChains();
  return deploy(deployer, chains[0].rpc, "DummyProposalExecutor", []);
}

export function deployDummyState(deployer: Wallet) {
  const chains = getChains();
  return deploy(deployer, chains[1].rpc, "DummyState", []);
}
