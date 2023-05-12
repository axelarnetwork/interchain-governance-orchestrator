import { start } from "./utils/start";
import { expect } from "chai";
import { Contract, Wallet } from "ethers";
import { deploy } from "./utils/deploy";
import { getChains } from "./utils/chains";
import { ethers } from "hardhat";

describe("Proposal", function () {
  const deployer = Wallet.createRandom();
  let sender: Contract;
  let executor: Contract;
  let dummyProposalExecutor: Contract;
  let dummyState: Contract;

  function deployInterchainProposalSender() {
    const chains = getChains();
    return deploy(deployer, chains[0].rpc, "InterchainProposalSender", [
      chains[0].gateway,
      chains[0].gasService,
    ]);
  }

  function deployInterchainProposalExecutor() {
    const chains = getChains();
    return deploy(deployer, chains[1].rpc, "InterchainProposalExecutor", [
      chains[1].gateway,
    ]);
  }

  function deployDummyProposalExecutor() {
    const chains = getChains();
    return deploy(deployer, chains[0].rpc, "DummyProposalExecutor", []);
  }

  function deployDummyState() {
    const chains = getChains();
    return deploy(deployer, chains[1].rpc, "DummyState", []);
  }

  const waitProposalExecuted = (payload: string, executorContract: Contract) =>
    new Promise((resolve, reject) => {
      executorContract.on(
        executor.filters.ProposalExecuted(ethers.utils.keccak256(payload)),
        (payloadHash) => {
          resolve(payloadHash);
        }
      );
    });

  before(async function () {
    // Start local chains
    await start([deployer.address]);

    // Deploy contracts
    sender = await deployInterchainProposalSender();
    executor = await deployInterchainProposalExecutor();
    dummyProposalExecutor = await deployDummyProposalExecutor();
    dummyState = await deployDummyState();

    // Transfer ownership of the InterchainProposalSender to the DummyProposalExecutor contract
    await sender.transferOwnership(dummyProposalExecutor.address);
  });

  it("should be able to execute a proposal with to a single target contract", async function () {
    // Encode the payload for the destination chain
    const payload = ethers.utils.defaultAbiCoder.encode(
      ["address[]", "uint256[]", "string[]", "bytes[]"],
      [
        [dummyState.address],
        [0],
        ["setState(string)"],
        [ethers.utils.defaultAbiCoder.encode(["string"], ["Hello World"])],
      ]
    );

    const tx = await dummyProposalExecutor.propose(
      [sender.address],
      [ethers.utils.parseEther("0.0001")],
      ["interchainPropose(string,string,bytes)"],
      [
        ethers.utils.defaultAbiCoder.encode(
          ["string", "string", "bytes"],
          ["Avalanche", executor.address, payload]
        ),
      ],
      { value: ethers.utils.parseEther("0.0001") }
    );

    await waitProposalExecuted(payload, executor);

    await expect(await dummyState.message()).to.equal("Hello World");
  });

  it("should be able to execute a proposal with to multiple target contracts", async function () {
    const dummyState2 = await deployDummyState();
    const dummyState3 = await deployDummyState();

    // Encode the payload for the destination chain
    const genMsg = (msg: string) =>
      ethers.utils.defaultAbiCoder.encode(["string"], [msg]);

    const payload = ethers.utils.defaultAbiCoder.encode(
      ["address[]", "uint256[]", "string[]", "bytes[]"],
      [
        [dummyState.address, dummyState2.address, dummyState3.address],
        [0, 0, 0],
        ["setState(string)", "setState(string)", "setState(string)"],
        [
          genMsg("Hello World1"),
          genMsg("Hello World2"),
          genMsg("Hello World3"),
        ],
      ]
    );

    const tx = await dummyProposalExecutor.propose(
      [sender.address],
      [ethers.utils.parseEther("0.0001")],
      ["interchainPropose(string,string,bytes)"],
      [
        ethers.utils.defaultAbiCoder.encode(
          ["string", "string", "bytes"],
          ["Avalanche", executor.address, payload]
        ),
      ],
      { value: ethers.utils.parseEther("0.0001") }
    );

    await waitProposalExecuted(payload, executor);

    expect(await dummyState.message()).to.equal("Hello World1");
    expect(await dummyState2.message()).to.equal("Hello World2");
    expect(await dummyState3.message()).to.equal("Hello World3");
  });
});
