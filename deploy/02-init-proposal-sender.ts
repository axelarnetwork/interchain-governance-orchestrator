import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { contracts } from "../constants";

const contractName = "InterchainProposalSender";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { execute, read } = hre.deployments;
  const [deployer] = await hre.getUnnamedAccounts();
  const chainName = hre.network.name;

  const initialized = await read(contractName, "initialized");

  if (initialized) {
    console.log(`${contractName} already initialized`);
  } else {
    console.log(`${contractName} is not initialized, initializing...`);
    const initArgs = [
      contracts[chainName].gateway,
      contracts[chainName].gasService,
    ];
    const executeTx = await execute(
      contractName,
      {
        from: deployer,
      },
      "initialize",
      ...initArgs
    );
    console.log(`${contractName} initialized`, executeTx.transactionHash);
  }
};

deploy.tags = [contractName];

export default deploy;
