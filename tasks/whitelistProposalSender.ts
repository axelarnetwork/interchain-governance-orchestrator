import { task } from 'hardhat/config';
import {
  getDeploymentAddress,
  getInterchainProposalSenderAddress,
} from './helpers/deployment';

task('whitelistSender', 'Whitelist proposal sender')
  .addPositionalParam('sourceChain')
  .addOptionalParam('sourceSender')
  .setAction(async (taskArgs, hre) => {
    const { sourceChain, sourceSender } = taskArgs;
    const ethers = hre.ethers;

    const interchainProposalSenderAddress =
      sourceSender ||
      getInterchainProposalSenderAddress(sourceChain.toLowerCase());

    if (!interchainProposalSenderAddress) {
      throw new Error(
        `InterchainProposalSender is not found on ${sourceChain}`,
      );
    }

    const executorAddress = getDeploymentAddress(
      hre,
      'InterchainProposalExecutor',
      hre.network.name,
    );

    const executor = await ethers.getContractAt(
      'InterchainProposalExecutor',
      executorAddress,
    );

    const tx = await executor.setWhitelistedProposalSender(
      sourceChain,
      interchainProposalSenderAddress,
      true,
    );

    console.log(`setWhitelistedProposalSender: ${tx.hash}`);
  });
