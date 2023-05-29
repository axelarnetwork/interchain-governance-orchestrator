import { task } from "hardhat/config";
import { ProposalExecutor } from "../typechain-types/contracts/ProposalExecutor";

task("whitelistSender", "Whitelist proposal sender")
  .addPositionalParam("sourceChain")
  .addPositionalParam("sourceInterchainSender")
  .setAction(async (taskArgs, hre) => {
    const { sourceChain, sourceInterchainSender } = taskArgs;
    const ethers = hre.ethers;

    // get executor contract
    const executor = await ethers.getContract<ProposalExecutor>(
      "ProposalExecutor"
    );

    const tx = await executor.setWhitelistedProposalSender(
      sourceChain,
      sourceInterchainSender,
      true
    );

    console.log(`setWhitelistedProposalSender: ${tx.hash}`);
  });
