import { Wallet } from "ethers";
import { ethers } from "hardhat";
import { getChains } from "./chains";
import config from "../../hardhat.config";

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
  return deploy(deployer, chains[0].rpc, "Timelock", [deployer.address, "3"]);
}

export function deployComp(deployer: Wallet) {
  const chains = getChains();
  return deploy(deployer, chains[0].rpc, "Comp", [deployer.address]);
}

export async function deployGovernorBravo(
  deployer: Wallet,
  timelockAddress: string,
  compAddress: string
) {
  const chains = getChains();
  const votingPeriod = "5"; // 5 seconds
  const votingDelay = "0"; // No delay
  const proposalThreshold = ethers.utils.parseEther("1000").toString(); // 1000 COMP
  const contract = await deploy(
    deployer,
    chains[0].rpc,
    "GovernorBravoDelegate",
    []
  );
  const args = [
    timelockAddress,
    compAddress,
    votingPeriod,
    votingDelay,
    proposalThreshold,
  ];

  await contract.initialize(...args);

  return contract;
}
