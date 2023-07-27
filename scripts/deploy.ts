import { HardhatRuntimeEnvironment } from "hardhat/types";
const {
  deployCreate3Contract,
} = require("@axelar-network/axelar-gmp-sdk-solidity");
import {contracts} from '../constants'

export async function deploy3(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  salt: string,
  args: string[]
) {
  const [deployer] = await hre.getUnnamedAccounts();
  const signer = await hre.ethers.getSigner(deployer);
  const { create3Deployer } = contracts[hre.network.name];

  const create3Address = create3Deployer || await hre.deployments
  .get("Create3Deployer")
  .then((d) => d.address);

  const artifact = await hre.artifacts.readArtifact(contractName);
  const result = await deployCreate3Contract(
    create3Address,
    signer,
    artifact,
    salt,
    args
  );

  console.log(`Deployed ${contractName}:`, result.address);
  await hre.deployments.save(contractName, {
    address: result.address,
    abi: artifact.abi,
    args,
    bytecode: artifact.bytecode,
  });
}
