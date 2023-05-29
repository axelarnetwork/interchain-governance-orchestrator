import { task } from "hardhat/config";
import { ProposalExecutor } from "../typechain-types/contracts/ProposalExecutor";

task("whitelistCaller", "Whitelist proposal caller")
  .addPositionalParam("sourceChain")
  .addPositionalParam("sourceCaller")
  .setAction(async (taskArgs, hre) => {
    const { sourceChain, sourceCaller } = taskArgs;
    // get signer
    const ethers = hre.ethers;

    // get executor contract
    const executor = await ethers.getContract<ProposalExecutor>(
      "ProposalExecutor"
    );

    const tx = await executor.setWhitelistedProposalCaller(
      sourceChain,
      sourceCaller,
      true
    );

    console.log(`setWhitelistedProposalCaller: ${tx.hash}`);
  });
