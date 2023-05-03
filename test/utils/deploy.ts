import { Wallet } from "ethers";
import { ethers } from "hardhat";

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
