import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { contracts } from "../constants";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deterministic } = hre.deployments;
  const [deployer] = await hre.getUnnamedAccounts();
  const chainName = hre.network.name;

  const { deploy } = await deterministic("InterchainProposalExecutor", {
    from: deployer,
    salt: hre.ethers.utils.id(deployer + "v1"),
    args: [],
  });

  const receipt = await deploy();

  console.log("Deployed InterchainProposalExecutor:", receipt.address);
};

deploy.tags = ["InterchainProposalExecutor"];

export default deploy;
