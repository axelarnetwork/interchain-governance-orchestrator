import { Wallet } from "ethers";
import { ethers } from "hardhat";
import { getChains } from "./chains";
import { Chain } from "../types/chain";

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

export async function deployInterchainProposalSender(
  deployer: Wallet,
  chain: Chain = getChains()[0]
) {
  const contract = await deploy(
    deployer,
    chain.rpc,
    "InterchainProposalSender",
    [chain.gateway, chain.gasService]
  );

  return contract;
}

export async function deployProposalExecutor(
  deployer: Wallet,
  chain: Chain = getChains()[1]
) {
  const contract = await deploy(deployer, chain.rpc, "ProposalExecutor", [
    chain.gateway,
  ]);

  return contract;
}

export function deployDummyState(
  deployer: Wallet,
  chain: Chain = getChains()[1]
) {
  return deploy(deployer, chain.rpc, "DummyState", []);
}

export function deployTimelock(deployer: Wallet) {
  const chains = getChains();
  return deploy(deployer, chains[0].rpc, "Timelock", [deployer.address, "1"]);
}

export function deployComp(deployer: Wallet) {
  const chains = getChains();
  return deploy(deployer, chains[0].rpc, "Comp", [deployer.address]);
}

export async function deployGovernorAlpha(
  deployer: Wallet,
  timelockAddress: string,
  compAddress: string
) {
  const chains = getChains();
  const contract = await deploy(deployer, chains[0].rpc, "GovernorAlpha", [
    timelockAddress,
    compAddress,
    deployer.address,
  ]);

  return contract;
}
