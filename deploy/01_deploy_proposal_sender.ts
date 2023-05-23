import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { contracts } from "../constants";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deploy } = hre.deployments;
  const [deployer] = await hre.getUnnamedAccounts();
  const chainName = hre.network.name;

  const args = [contracts[chainName].gateway, contracts[chainName].gasService];
  const result = await deploy("InterchainProposalSender", {
    from: deployer,
    args,
  });

  console.log("Deployed InterchainProposalSender:", result.address);

  if (chainName === "hardhat") return;
  await hre
    .run("verify:verify", {
      address: result.address,
      constructorArguments: args,
    })
    .catch((e) => console.log(e.message));
};

deploy.tags = ["InterchainProposalSender"];

export default deploy;
