import fs from "fs";
import { start } from "./utils/start";
import { expect } from "chai";
import { Contract, Wallet } from "ethers";
import { deploy } from "./utils/deploy";
import { getChains } from "./utils/chains";
import { ethers } from "hardhat";
import { sleep } from "./utils/sleep";

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

  it("Propose", async function () {
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

    await sleep(5000);

    expect(await dummyState.message()).to.equal("Hello World");
  });
});
