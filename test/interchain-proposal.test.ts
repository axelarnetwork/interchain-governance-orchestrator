import { start } from "./utils/start";
import { expect } from "chai";
import { Contract, Wallet } from "ethers";
import { ethers } from "hardhat";
import { setLogger } from "@axelar-network/axelar-local-dev";
import {
  deployDummyProposalExecutor,
  deployDummyState,
  deployInterchainProposalExecutor,
  deployInterchainProposalSender,
} from "./utils/deploy";
import { waitProposalExecuted } from "./utils/wait";

setLogger(() => null);

describe("Interchain Proposal", function () {
  const deployer = Wallet.createRandom();
  let sender: Contract;
  let executor: Contract;
  let dummyProposalExecutor: Contract;
  let dummyState: Contract;

  // redefine "slow" test for this test suite
  this.slow(10000);

  before(async function () {
    // Start local chains
    await start([deployer.address]);

    // Deploy contracts
    sender = await deployInterchainProposalSender(deployer);
    executor = await deployInterchainProposalExecutor(deployer);
    dummyProposalExecutor = await deployDummyProposalExecutor(deployer);
    dummyState = await deployDummyState(deployer);

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

    await dummyProposalExecutor.propose(
      [sender.address],
      [ethers.utils.parseEther("0.0001")],
      ["executeRemoteProposal(string,string,bytes)"],
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
    const dummyState2 = await deployDummyState(deployer);
    const dummyState3 = await deployDummyState(deployer);

    // Encode the payload for the destination chain
    const encodeMsg = (msg: string) =>
      ethers.utils.defaultAbiCoder.encode(["string"], [msg]);

    const payload = ethers.utils.defaultAbiCoder.encode(
      ["address[]", "uint256[]", "string[]", "bytes[]"],
      [
        [dummyState.address, dummyState2.address, dummyState3.address],
        [0, 0, 0],
        ["setState(string)", "setState(string)", "setState(string)"],
        [
          encodeMsg("Hello World1"),
          encodeMsg("Hello World2"),
          encodeMsg("Hello World3"),
        ],
      ]
    );

    await dummyProposalExecutor.propose(
      [sender.address],
      [ethers.utils.parseEther("0.0001")],
      ["executeRemoteProposal(string,string,bytes)"],
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
