const { start, stop } = require("./utils/server");
const { expect } = require("chai");
const { ethers, Wallet } = require("ethers");
const { setLogger } = require("@axelar-network/axelar-local-dev");
const {
  deployComp,
  deployDummyState,
  deployGovernorAlpha,
  deployProposalExecutor,
  deployInterchainProposalSender,
  deployTimelock,
} = require("./utils/deploy");
const { waitProposalExecuted } = require("./utils/wait");
const { transferTimelockAdmin } = require("./utils/timelock");
const { voteQueueExecuteProposal } = require("./utils/governance");
const { getChains } = require("./utils/chains");
const { after } = require("mocha");
const { DummyState__factory } = require("../../typechain-types");

setLogger(() => null);
console.log = () => null;

describe("Interchain Governance Executor for Multiple Destination Chains [ @skip-on-coverage ]", function () {
  const deployer = Wallet.createRandom();
  let sender;
  let executors = [];
  let comp;
  let timelock;
  let governorAlpha;
  let dummyStates = [];
  let destChains = [];
  let srcChain;
  const DummyStateInterface = DummyState__factory.createInterface();

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
    srcChain = chains[0];
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

    const xCalls = dummyStates.map((dummyState, i) => ({
      destinationChain: destChains[i].name,
      destinationContract: executors[i].address,
      gas: ethers.utils.parseEther("0.025"),
      calls: [
        {
          target: dummyState.address,
          value: 0,
          callData: DummyStateInterface.encodeFunctionData("setState", [
            "Hello World",
          ]),
        },
      ],
    }));

    // Propose the payload to the Governor ntract
    const axelarFee = ethers.utils.parseEther("0.1");

    await governorAlpha.propose(
      [sender.address],
      [axelarFee],
      ["sendProposals((string,string,uint256,(address,uint256,bytes)[])[])"],
      [
        ethers.utils.defaultAbiCoder.encode(
          [
            "(string destinationChain,string destinationContract,uint256 gas,(address target,uint256 value,bytes callData)[] calls)[]",
          ],
          [xCalls]
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
      ["address", "(address target, uint256 value, bytes callData)[]"],
      [timelock.address, xCalls[0].calls]
    );

    await Promise.all(
      executors.map((executor) =>
        waitProposalExecuted(
          srcChain.name,
          sender.address,
          timelock.address,
          payload,
          executor
        )
      )
    );

    for (let i = 0; i < executors.length; i++) {
      await expect(await dummyStates[i].message()).to.equal("Hello World");
    }
  });
});
