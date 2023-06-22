import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await hre.getUnnamedAccounts();
  const { deterministic } = hre.deployments;

  const { deploy } = await deterministic("Deployer", {
    from: deployer,
  });

  const result = await deploy();
  console.log("Deploy Deployer:", result.address);
};

deploy.tags = ["Deployer"];
deploy.skip = (env: HardhatRuntimeEnvironment) =>
  env.deployments.getOrNull("Deployer").then((d) => !!d);

export default deploy;
