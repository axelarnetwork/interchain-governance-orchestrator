import { task } from 'hardhat/config';
import { InterchainProposalExecutor } from '../typechain-types/contracts/InterchainProposalExecutor';
import { getDeploymentAddress } from './helpers/deployment';

task('whitelistCaller', 'Whitelist proposal caller')
  .addPositionalParam('sourceChain')
  .addPositionalParam('sourceCaller')
  .setAction(async (taskArgs, hre) => {
    const { sourceChain, sourceCaller } = taskArgs;
    const ethers = hre.ethers;

    const executorAddress = getDeploymentAddress(
      hre,
      'InterchainProposalExecutor',
      hre.network.name,
    );
    const executor = await ethers.getContractAt(
      'InterchainProposalExecutor',
      executorAddress,
    );

    const tx = await executor.setWhitelistedProposalCaller(
      sourceChain,
      sourceCaller,
      true,
    );

    console.log(`setWhitelistedProposalCaller: ${tx.hash}`);
  });
