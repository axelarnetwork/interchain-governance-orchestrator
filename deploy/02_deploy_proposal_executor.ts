import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { contracts } from "../constants";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deploy } = hre.deployments;
  const [deployer] = await hre.getUnnamedAccounts();
  const chainName = hre.network.name;

  const args = [contracts[chainName].gateway];
  const result = await deploy("InterchainProposalExecutor", {
    from: deployer,
    args,
  });

  console.log("Deployed InterchainProposalExecutor:", result.address);

  if (chainName === "hardhat") return;
  await hre
    .run("verify:verify", {
      address: result.address,
      constructorArguments: args,
    })
    .catch((e) => console.log(e.message));
};

deploy.tags = ["InterchainProposalExecutor"];

export default deploy;
