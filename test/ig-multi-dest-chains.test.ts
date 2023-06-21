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
import { getChains } from "./utils/chains";
import { after } from "mocha";
import { Chain } from "./types/chain";

setLogger(() => null);
console.log = () => null;

describe("Interchain Governance for Multiple Destination Chains", function () {
  const deployer = Wallet.createRandom();
  let sender: Contract;
  let executors: Contract[] = [];
  let comp: Contract;
  let timelock: Contract;
  let governorAlpha: Contract;
  let dummyStates: Contract[] = [];
  let destChains: Chain[] = [];

  // redefine "slow" test for this test suite
  this.slow(15000);
  this.timeout(20000);

  before(async () => {
    // Start local chains
    await start(
      [deployer.address],
      ["Ethereum", "Avalanche", "Polygon", "Binance", "Fantom"]
    );

    const chains = getChains();
    const srcChain = chains[0];
    destChains = chains.slice(1);

    // Deploy contracts
    sender = await deployInterchainProposalSender(deployer);
    for (let i = 0; i < chains.length - 1; i++) {
      const executor = await deployProposalExecutor(deployer, chains[i + 1]);
      executors.push(executor);
    }
    comp = await deployComp(deployer);
    timelock = await deployTimelock(deployer);

    governorAlpha = await deployGovernorAlpha(
      deployer,
      timelock.address,
      comp.address
    );

    for (let i = 0; i < executors.length; i++) {
      // Whitelist the sender contract to executor contract
      await executors[i].setWhitelistedProposalSender(
        srcChain.name,
        sender.address,
        true
      );

      // Whitelist the timelock contract to executor contract
      await executors[i].setWhitelistedProposalCaller(
        srcChain.name,
        timelock.address,
        true
      );

      const dummyState = await deployDummyState(deployer, chains[i + 1]);
      dummyStates.push(dummyState);
    }

    // Transfer ownership of the Timelock contract to the Governor contract
    await transferTimelockAdmin(timelock, governorAlpha.address);

    // Complete the Timelock contract ownership transfer
    await governorAlpha.__acceptAdmin();
  });

  after(async () => {
    await stop();
  });

  it("should execute proposal at multiple destination chains", async function () {
    // Delegate votes the COMP token to the deployer
    await comp.delegate(deployer.address);
    const targets = dummyStates.map((dummyState) => dummyState.address);
    const values = dummyStates.map(() => 0);
    const signatures = dummyStates.map(() => "setState(string)");
    const calldatas = dummyStates.map(() =>
      ethers.utils.defaultAbiCoder.encode(["string"], ["Hello World"])
    );

    // Propose the payload to the Governor contract
    const axelarFee = ethers.utils.parseEther("0.1");
    await governorAlpha.propose(
      [sender.address],
      [axelarFee],
      [
        "broadcastProposalToChains(string[],string[],uint256[],address[][],uint256[][],string[][],bytes[][])",
      ],
      [
        ethers.utils.defaultAbiCoder.encode(
          [
            "string[]",
            "string[]",
            "uint256[]",
            "address[][]",
            "uint256[][]",
            "string[][]",
            "bytes[][]",
          ],
          [
            destChains.map((chain) => chain.name),
            executors.map((executor) => executor.address),
            destChains.map(() => ethers.utils.parseEther("0.025")),
            destChains.map((_, i) => [targets[i]]),
            destChains.map((_, i) => [values[i]]),
            destChains.map((_, i) => [signatures[i]]),
            destChains.map((_, i) => [calldatas[i]]),
          ]
        ),
      ],
      "Test Proposal"
    );

    // Read latest proposal ID created by deployer's address.
    const proposalId = await governorAlpha.latestProposalIds(deployer.address);
    console.log("Created Proposal ID:", proposalId.toString());

    // Vote, queue, and execute given proposal ID.
    await voteQueueExecuteProposal(
      deployer.address,
      proposalId,
      comp,
      governorAlpha,
      timelock,
      axelarFee
    );

    // Read proposal state
    const proposalState = await governorAlpha.state(proposalId);

    // Expect proposal to be in the succeeded state
    expect(proposalState).to.equal(7);

    // Wait for the proposal to be executed on the destination chain
    // Encode the payload for the destination chain
    const payload = ethers.utils.defaultAbiCoder.encode(
      ["address", "address[]", "uint256[]", "string[]", "bytes[]"],
      [
        timelock.address,
        [targets[0]],
        [values[0]],
        [signatures[0]],
        [calldatas[0]],
      ]
    );

    await Promise.all(
      executors.map((executor) => waitProposalExecuted(payload, executor))
    );

    for (let i = 0; i < executors.length; i++) {
      await expect(await dummyStates[i].message()).to.equal("Hello World");
    }
  });
});
