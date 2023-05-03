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

    console.log("Message Before:", await dummyState.message());
    console.log("Sent", tx.hash);
    await sleep(5000);

    console.log("Message After:", await dummyState.message());
  });

  // describe("Deployment", function () {
  //   it("Should set the right unlockTime", async function () {
  //     const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);

  //     expect(await lock.unlockTime()).to.equal(unlockTime);
  //   });

  //   it("Should set the right owner", async function () {
  //     const { lock, owner } = await loadFixture(deployOneYearLockFixture);

  //     expect(await lock.owner()).to.equal(owner.address);
  //   });

  //   it("Should receive and store the funds to lock", async function () {
  //     const { lock, lockedAmount } = await loadFixture(
  //       deployOneYearLockFixture
  //     );

  //     expect(await ethers.provider.getBalance(lock.address)).to.equal(
  //       lockedAmount
  //     );
  //   });

  //   it("Should fail if the unlockTime is not in the future", async function () {
  //     // We don't use the fixture here because we want a different deployment
  //     const latestTime = await time.latest();
  //     const Lock = await ethers.getContractFactory("Lock");
  //     await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
  //       "Unlock time should be in the future"
  //     );
  //   });
  // });

  // describe("Withdrawals", function () {
  //   describe("Validations", function () {
  //     it("Should revert with the right error if called too soon", async function () {
  //       const { lock } = await loadFixture(deployOneYearLockFixture);

  //       await expect(lock.withdraw()).to.be.revertedWith(
  //         "You can't withdraw yet"
  //       );
  //     });

  //     it("Should revert with the right error if called from another account", async function () {
  //       const { lock, unlockTime, otherAccount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // We can increase the time in Hardhat Network
  //       await time.increaseTo(unlockTime);

  //       // We use lock.connect() to send a transaction from another account
  //       await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
  //         "You aren't the owner"
  //       );
  //     });

  //     it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
  //       const { lock, unlockTime } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // Transactions are sent using the first signer by default
  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).not.to.be.reverted;
  //     });
  //   });

  //   describe("Events", function () {
  //     it("Should emit an event on withdrawals", async function () {
  //       const { lock, unlockTime, lockedAmount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw())
  //         .to.emit(lock, "Withdrawal")
  //         .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
  //     });
  //   });

  //   describe("Transfers", function () {
  //     it("Should transfer the funds to the owner", async function () {
  //       const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).to.changeEtherBalances(
  //         [owner, lock],
  //         [lockedAmount, -lockedAmount]
  //       );
  //     });
  //   });
  // });
});
