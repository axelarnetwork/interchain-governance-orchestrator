import { start, stop } from "./utils/server";
import { expect } from "chai";
import { ethers, Contract, Wallet } from "ethers";
import { setLogger } from "@axelar-network/axelar-local-dev";
import {
  deployComp,
  deployDummyState,
  deployGovernorAlpha,
  deployProposalExecutor,
  deployInterchainProposalSender,
  deployTimelock,
} from "./utils/deploy";
import { waitProposalExecuted } from "./utils/wait";
import { transferTimelockAdmin } from "./utils/timelock";
import { voteQueueExecuteProposal } from "./utils/governance";
import { sleep } from "./utils/sleep";
import { getChains } from "./utils/chains";
import { after } from "mocha";

setLogger(() => null);
console.log = () => null;

describe.skip("Interchain Governance for Multiple Destination Chains", function () {
  const deployer = Wallet.createRandom();
  let sender: Contract;
  let executor: Contract;
  let comp: Contract;
  let timelock: Contract;
  let governorAlpha: Contract;
  let dummyState: Contract;

  // redefine "slow" test for this test suite
  this.slow(15000);
  this.timeout(20000);

  before(async () => {
    // Start local chains
    await start([deployer.address]);

    const chains = getChains();

    // Deploy contracts
    sender = await deployInterchainProposalSender(deployer);
    executor = await deployProposalExecutor(deployer);
    comp = await deployComp(deployer);
    timelock = await deployTimelock(deployer);

    governorAlpha = await deployGovernorAlpha(
      deployer,
      timelock.address,
      comp.address
    );

    await executor.setWhitelistedProposalSender(
      chains[0].name,
      sender.address,
      true
    );

    // Whitelist the Governor contract to execute proposals
    await executor.setWhitelistedProposalCaller(
      chains[0].name,
      timelock.address,
      true
    );

    // Transfer ownership of the Timelock contract to the Governor contract
    await transferTimelockAdmin(timelock, governorAlpha.address);

    // Complete the Timelock contract ownership transfer
    await governorAlpha.__acceptAdmin();

    dummyState = await deployDummyState(deployer);
  });

  after(async () => {
    await stop();
  });


});
