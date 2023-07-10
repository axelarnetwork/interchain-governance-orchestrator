import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { deploy3 } from "../scripts/deploy";
import { contracts } from "../constants";

const contractName = "DummyState";
const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await hre.getUnnamedAccounts();
  await deploy3(hre, contractName, deployer + "v1", []);
};

deploy.tags = [contractName];
deploy.dependencies = ["DummyState"];

export default deploy;
