import { task } from "hardhat/config";
import { ProposalExecutor } from "../typechain-types/contracts/ProposalExecutor";

task("whitelistSender", "Whitelist proposal sender")
  .addPositionalParam("sourceChain")
  .addPositionalParam("sourceSender")
  .setAction(async (taskArgs, hre) => {
    const { sourceChain, sourceSender } = taskArgs;
    const ethers = hre.ethers;

    // get executor contract
    const executor = await ethers.getContract<ProposalExecutor>(
      "ProposalExecutor"
    );

    const tx = await executor.setWhitelistedProposalSender(
      sourceChain,
      sourceSender,
      true
    );

    console.log(`setWhitelistedProposalSender: ${tx.hash}`);
  });
