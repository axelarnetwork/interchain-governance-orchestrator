import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { deploy3 } from "../scripts/deploy";

const contractName = "DummyState";
const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await hre.getUnnamedAccounts();
  const artifact = await hre.artifacts.readArtifact(contractName);
  const salt = [deployer, artifact.bytecode, "v1", "test"].join()
  await deploy3(hre, contractName, salt, []);
};

deploy.tags = [contractName];
deploy.dependencies =["Deployer"];

export default deploy;
