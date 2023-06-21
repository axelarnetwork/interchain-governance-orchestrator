import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await hre.getUnnamedAccounts();

  const result = await hre.deployments.deploy("Deployer", {
    from: deployer,
  });

  console.log("Deploy Deployer:", result.address);
};

deploy.tags = ["Deployer"];
deploy.skip = (env: HardhatRuntimeEnvironment) =>
  env.deployments.getOrNull("Deployer").then((d) => !!d);

export default deploy;
