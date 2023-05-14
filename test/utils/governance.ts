import { BigNumber, Contract, ethers } from "ethers";
import { getChains } from "./chains";

// Hide unnecessary details in a single function call for completing the voting process including vote, queue and execute transaction.
export async function voteQueueExecuteProposal(
  deployerAddress: string,
  proposalId: string,
  comp: Contract,
  governorAlpha: Contract,
  timelock: Contract
) {
  const srcChainProvider = new ethers.providers.JsonRpcProvider(
    getChains()[0].rpc
  );

  // Advance time to the proposal's start block
  const votingDelay = await governorAlpha.votingDelay();
  await srcChainProvider.send("evm_mine", [{ blocks: votingDelay.toString() }]);

  // Cast vote for the proposal
  await governorAlpha.castVote(proposalId, true);
  const compBalance = await comp.balanceOf(deployerAddress);
  console.log(
    "Casted Vote with",
    ethers.utils.formatEther(compBalance),
    "COMP"
  );

  // Advance time to the proposal's end block
  const votingPeriod = await governorAlpha.votingPeriod();
  await srcChainProvider.send("evm_mine", [
    { blocks: votingPeriod.toString() },
  ]);

  // Queue the proposal
  await governorAlpha.queue(proposalId);
  console.log("Queued Proposal ID:", proposalId.toString());

  const delay = await timelock
    .delay()
    .then((delay: BigNumber) => delay.toHexString());

  // Advance time to the proposal's eta
  await srcChainProvider.send("evm_increaseTime", [delay]);

  // Execute the proposal
  await governorAlpha.execute(proposalId, {
    value: ethers.utils.parseEther("0.0001"),
  });

  console.log("Executed Proposal ID:", proposalId.toString());
}
