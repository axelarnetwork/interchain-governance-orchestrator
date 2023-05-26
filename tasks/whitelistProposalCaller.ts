import { task } from "hardhat/config";
import { InterchainProposalExecutor } from "../typechain-types/contracts/InterchainProposalExecutor";

task("whitelistCaller", "Whitelist proposal caller")
  .addPositionalParam("sourceChain")
  .addPositionalParam("sourceCaller")
  .setAction(async (taskArgs, hre) => {
    const { sourceChain, sourceCaller } = taskArgs;
    // get signer
    const ethers = hre.ethers;

    // get executor contract
    const executor = await ethers.getContract<InterchainProposalExecutor>(
      "InterchainProposalExecutor"
    );

    const tx = await executor.setWhitelistedProposalCaller(
      sourceChain,
      sourceCaller,
      true
    );

    console.log(`setWhitelistedProposalCaller: ${tx.hash}`);
  });
