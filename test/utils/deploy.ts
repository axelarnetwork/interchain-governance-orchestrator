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
