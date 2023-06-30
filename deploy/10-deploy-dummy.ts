import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await hre.getUnnamedAccounts();
  const { deploy } = hre.deployments;

  const result = await deploy("DummyState",{
      from: deployer,
    });
  console.log("Deploy Dummy:", result.address);
};

deploy.tags = ["Dummy"];
deploy.skip = (env: HardhatRuntimeEnvironment) =>
  env.deployments.getOrNull("Dummy").then((d) => !!d);

export default deploy;
