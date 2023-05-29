import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { contracts } from "../constants";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deterministic, deploy } = hre.deployments;
  const [deployer] = await hre.getUnnamedAccounts();

  if (process.env.test === "true") {
    const { address } = await deploy("ProposalExecutor", {
      from: deployer,
      args: [],
    });

    console.log("Deployed ProposalExecutor:", address);
  } else {
    const { deploy } = await deterministic("ProposalExecutor", {
      from: deployer,
      salt: hre.ethers.utils.id(deployer + "v1"),
      args: [],
    });

    const receipt = await deploy();

    console.log("Deployed ProposalExecutor:", receipt.address);
  }
};

deploy.tags = ["ProposalExecutor"];

export default deploy;
