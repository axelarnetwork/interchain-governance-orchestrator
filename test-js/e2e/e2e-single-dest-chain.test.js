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
const { sleep } = require("./utils/sleep");

setLogger(() => null);
console.log = () => null;

describe("Interchain Governance Executor For Single Destination Chain [ @skip-on-coverage ]", function () {
  const deployer = Wallet.createRandom();
  let sender;
  let executor;
  let comp;
  let timelock;
  let governorAlpha;
  let dummyState;
  let srcChain;
  const DummyStateInterface = DummyState__factory.createInterface();

  // redefine "slow" test for this test suite
  this.slow(15000);
  this.timeout(20000);

  before(async () => {
    // Start local chains
    await start([deployer.address]);

    const chains = getChains();
    srcChain = chains[0];

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
      srcChain.name,
      sender.address,
      true
    );

    // Whitelist the Governor contract to execute proposals
    await executor.setWhitelistedProposalCaller(
      srcChain.name,
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

  it("should execute a proposal with a single destination target contract", async function () {
    // Delegate votes the COMP token to the deployer
    await comp.delegate(deployer.address);

    const calls = [
      {
        target: dummyState.address,
        value: 0,
        callData: DummyStateInterface.encodeFunctionData("setState", [
          "Hello World",
        ]),
      },
    ];

    // Propose the payload to the Governor contract
    const axelarFee = ethers.utils.parseEther("0.1");
    await governorAlpha.propose(
      [sender.address],
      [axelarFee],
      ["sendProposal(string,string,(address,uint256,bytes)[])"],
      [
        ethers.utils.defaultAbiCoder.encode(
          [
            "string",
            "string",
            "(address target, uint256 value, bytes callData)[]",
          ],
          ["Avalanche", executor.address, calls]
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
      [timelock.address, calls]
    );
    await waitProposalExecuted(
      srcChain.name,
      sender.address,
      timelock.address,
      payload,
      executor
    );

    // Expect the dummy state to be updated
    await expect(await dummyState.message()).to.equal("Hello World");
  });

  it("should execute a proposal with multiple destination target contracts", async function () {
    const dummyState2 = await deployDummyState(deployer);
    const dummyState3 = await deployDummyState(deployer);

    // Encode the payload for the destination chain
    const calls = [
      {
        target: dummyState.address,
        value: 0,
        callData: DummyStateInterface.encodeFunctionData("setState", [
          "Hello World1",
        ]),
      },
      {
        target: dummyState2.address,
        value: 0,
        callData: DummyStateInterface.encodeFunctionData("setState", [
          "Hello World2",
        ]),
      },
      {
        target: dummyState3.address,
        value: 0,
        callData: DummyStateInterface.encodeFunctionData("setState", [
          "Hello World3",
        ]),
      },
    ];

    // Delegate votes the COMP token to the deployer
    await comp.delegate(deployer.address);

    // Propose the payload to the Governor contract
    const axelarFee = ethers.utils.parseEther("0.0001");
    await governorAlpha.propose(
      [sender.address],
      [axelarFee],
      ["sendProposal(string,string,(address,uint256,bytes)[])"],
      [
        ethers.utils.defaultAbiCoder.encode(
          [
            "string",
            "string",
            "(address target, uint256 value, bytes callData)[]",
          ],
          ["Avalanche", executor.address, calls]
        ),
      ],
      { value: ethers.utils.parseEther("0.0001") }
    );

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

    // Wait for the proposal to be executed on the destination chain
    const payload = ethers.utils.defaultAbiCoder.encode(
      ["address", "(address target, uint256 value, bytes callData)[]"],
      [timelock.address, calls]
    );
    await waitProposalExecuted(
      srcChain.name,
      sender.address,
      timelock.address,
      payload,
      executor
    );

    expect(await dummyState.message()).to.equal("Hello World1");
    expect(await dummyState2.message()).to.equal("Hello World2");
    expect(await dummyState3.message()).to.equal("Hello World3");
  });

  it("should not execute if the call is initiated by an invalid InterchainProposalSender contract address", async function () {
    const maliciousSender = await deployInterchainProposalSender(deployer);
    const dummyContract = await deployDummyState(deployer);

    const calls = [
      {
        target: dummyContract.address,
        value: 0,
        callData: DummyStateInterface.encodeFunctionData("setState", [
          "Hello World",
        ]),
      },
    ];

    await maliciousSender.sendProposal("Avalanche", executor.address, calls, {
      value: ethers.utils.parseEther("0.0001"),
    });

    await sleep(5000);

    expect(await dummyContract.message()).to.equal("");
  });

  it("should not execute if the call is initiated by a non-whitelisted proposal caller address", async function () {
    const dummyContract = await deployDummyState(deployer);

    // Encode the payload for the destination chain
    const calls = [
      {
        target: dummyContract.address,
        value: 0,
        callData: DummyStateInterface.encodeFunctionData("setState", [
          "Hello World",
        ]),
      },
    ];

    // try to execute the proposal
    await sender.sendProposal("Avalanche", executor.address, calls, {
      value: ethers.utils.parseEther("0.0001"),
    });

    await sleep(5000);

    // Expect the dummy state to not be updated
    expect(await dummyContract.message()).to.equal("");

    const sourceChain = getChains()[0].name;

    // try to set the sender as a whitelisted proposal caller
    await executor.setWhitelistedProposalCaller(
      sourceChain,
      deployer.address,
      true
    );

    // try to execute the proposal again
    await sender.sendProposal("Avalanche", executor.address, calls, {
      value: ethers.utils.parseEther("0.001"),
    });

    // Wait for the proposal to be executed on the destination chain
    const payload = ethers.utils.defaultAbiCoder.encode(
      ["address", "(address target, uint256 value, bytes callData)[]"],
      [deployer.address, calls]
    );
    await waitProposalExecuted(
      srcChain.name,
      sender.address,
      deployer.address,
      payload,
      executor
    );

    // Expect the dummy state to be updated
    expect(await dummyContract.message()).to.equal("Hello World");
  });
});
