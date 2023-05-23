import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  // const { deploy } = hre.deployments;
  const { deterministic } = hre.deployments;
  const [deployer] = await hre.getUnnamedAccounts();
  const chainName = hre.network.name;

  const args: any[] = [];

  const { deploy } = await deterministic("InterchainProposalSender", {
    from: deployer,
    salt: hre.ethers.utils.id(deployer + "v1"),
    args,
  });

  const receipt = await deploy();
  console.log("Deployed InterchainProposalSender:", receipt.address);

  if (chainName === "hardhat") return;
  await hre
    .run("verify:verify", {
      address: receipt.address,
      constructorArguments: args,
    })
    .catch((e) => console.log(e.message));
};

deploy.tags = ["InterchainProposalSender"];

export default deploy;
