import { task } from "hardhat/config";
import { InterchainProposalExecutor } from "../typechain-types/contracts/InterchainProposalExecutor";

task("whitelistSender", "Whitelist proposal sender")
  .addPositionalParam("sourceChain")
  .addPositionalParam("sourceSender")
  .setAction(async (taskArgs, hre) => {
    const { sourceChain, sourceSender } = taskArgs;
    const ethers = hre.ethers;

    // get executor contract
    const executor = await ethers.getContract<InterchainProposalExecutor>(
      "InterchainProposalExecutor"
    );

    const tx = await executor.setWhitelistedProposalSender(
      sourceChain,
      sourceSender,
      true
    );

    console.log(`setWhitelistedProposalSender: ${tx.hash}`);
  });
