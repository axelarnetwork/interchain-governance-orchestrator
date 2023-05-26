import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deterministic } = hre.deployments;
  const [deployer] = await hre.getUnnamedAccounts();

  const { deploy } = await deterministic("InterchainProposalSender", {
    from: deployer,
    salt: hre.ethers.utils.id(deployer + "v1"),
    args: [],
  });

  const receipt = await deploy();

  console.log("Deployed InterchainProposalSender:", receipt.address);
};

deploy.tags = ["InterchainProposalSender"];

export default deploy;
