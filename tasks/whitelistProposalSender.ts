import { task } from "hardhat/config";
import { InterchainProposalExecutor } from "../typechain-types/contracts/InterchainProposalExecutor";

task("whitelistSender", "Whitelist proposal sender")
  .addPositionalParam("sourceChain")
  .addPositionalParam("sourceInterchainSender")
  .setAction(async (taskArgs, hre) => {
    const { sourceChain, sourceInterchainSender } = taskArgs;
    const ethers = hre.ethers;

    // get executor contract
    const executor = await ethers.getContract<InterchainProposalExecutor>(
      "InterchainProposalExecutor"
    );

    await executor.setSourceInterchainSender(
      sourceChain,
      sourceInterchainSender,
      true
    );
  });
