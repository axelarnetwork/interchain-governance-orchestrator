import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const chainName = hre.network.name;

  const verifyContractNames = [
    "InterchainProposalSender",
    "ProposalExecutor",
  ];

  for (const contractName of verifyContractNames) {
    const contract = await hre.deployments
      .get(contractName)
      .catch((e) => undefined);
    if (!contract) continue;

    console.log(`Verifying ${contractName}...`);
    await hre
      .run("verify:verify", {
        address: contract.address,
        constructorArguments: contract.args,
      })
      .catch((e) => console.log(e.message));
  }
};

deploy.skip = (env) => Promise.resolve(env.network.name === "hardhat");
deploy.tags = ["VerifyContract"];

export default deploy;
