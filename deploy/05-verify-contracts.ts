import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const chainName = hre.network.name;
  if (chainName === "hardhat") return;

  const interchainProposalSender = await hre.deployments.get(
    "InterchainProposalSender"
  );
  const interchainProposalExecutor = await hre.deployments.get(
    "InterchainProposalExecutor"
  );

  const verifyContractNames = [
    "InterchainProposalSender",
    "InterchainProposalExecutor",
  ];

  for (const contractName of verifyContractNames) {
    const contract = await hre.deployments.get(contractName);
    console.log(`Verifying ${contractName}...`);
    await hre
      .run("verify:verify", {
        address: contract.address,
        constructorArguments: contract.args,
      })
      .catch((e) => console.log(e.message));
  }
};

deploy.tags = ["verify"];

export default deploy;
