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

    const tx = await executor.setWhitelistedProposalSender(
      sourceChain,
      sourceInterchainSender,
      true
    );

    console.log(`setWhitelistedProposalSender: ${tx.hash}`);
  });
