import { task } from "hardhat/config";
import { InterchainProposalExecutor } from "../typechain-types/contracts/InterchainProposalExecutor";
import { getInterchainProposalSenderAddress } from "./helpers/deployment";

task("whitelistSender", "Whitelist proposal sender")
  .addPositionalParam("sourceChain")
  .addOptionalParam("sourceSender")
  .setAction(async (taskArgs, hre) => {
    const { sourceChain, sourceSender } = taskArgs;
    const ethers = hre.ethers;

    const interchainProposalSenderAddress = sourceSender || getInterchainProposalSenderAddress(sourceChain.toLowerCase())

    if(!interchainProposalSenderAddress) {
      throw new Error(`InterchainProposalSender is not found on ${sourceChain}`)
    }

    // get executor contract
    const executor = await ethers.getContract<InterchainProposalExecutor>(
      "InterchainProposalExecutor"
    );

    const tx = await executor.setWhitelistedProposalSender(
      sourceChain,
      interchainProposalSenderAddress,
      true
    );

    console.log(`setWhitelistedProposalSender: ${tx.hash}`);
  });
