import { ethers } from "hardhat";
import {
  IAxelarGateway,
  TestProposalExecutor__factory as TestProposalExecutorFactory,
  TestProposalExecutor,
  DummyState__factory as DummyStateFactory,
  DummyState,
} from "../../typechain-types";
import { contracts } from "../../constants";
import { chains } from "../../constants/chains";
import { expect } from "chai";
import { Signer } from "ethers";

describe("Interchain Proposal Executor", function () {
  let executor: TestProposalExecutor;
  let signer: Signer;
  let signerAddress: string;
  let dummy: DummyState;
  let gateway: IAxelarGateway;

  // redefine "slow" test for this test suite
  this.slow(10000);
  this.timeout(15000);

  beforeEach(async () => {
    [signer] = await ethers.getSigners();
    signerAddress = await signer.getAddress();
    const executorFactory =
      await ethers.getContractFactory<TestProposalExecutorFactory>(
        "TestProposalExecutor"
      );
    executor = await executorFactory.deploy(
      contracts[chains.hardhat].gateway,
      signerAddress
    );

    const dummyStateFactory =
      await ethers.getContractFactory<DummyStateFactory>("DummyState");

    dummy = await dummyStateFactory.deploy();

    gateway = await ethers.getContractAt<IAxelarGateway>(
      "IAxelarGateway",
      contracts[chains.hardhat].gateway
    );
  });

  describe("_execute", function () {
    it("should be able to call target contract", async function () {
      // whitelist caller and sender
      await executor.setWhitelistedProposalCaller(
        chains.ethereum,
        signerAddress,
        true
      );
      await executor.setWhitelistedProposalSender(
        chains.ethereum,
        signerAddress,
        true
      );

      const callData = dummy.interface.encodeFunctionData("setState", [
        "Hello World",
      ]);
      const calls = [
        {
          target: dummy.address,
          value: 0,
          callData,
        },
      ];

      const payload = ethers.utils.defaultAbiCoder.encode(
        ["address", "tuple(address target, uint256 value, bytes callData)[]"],
        [signerAddress, calls]
      );

      const broadcast = () =>
        executor.forceExecute(chains.ethereum, signerAddress, payload);

      await expect(broadcast())
        .to.emit(executor, "BeforeProposalExecuted(string,string,bytes)")
        .withArgs(chains.ethereum, signerAddress, payload);

      await expect(broadcast())
        .to.emit(executor, "TargetExecuted(address,uint256,bytes)")
        .withArgs(calls[0].target, calls[0].value, calls[0].callData);

      await expect(broadcast())
        .to.emit(executor, "ProposalExecuted(bytes32 payloadHash)")
        .withArgs(ethers.utils.keccak256(payload));
    });

    it("should emit error when execution failed", async function () {
      // whitelist caller and sender
      await executor.setWhitelistedProposalCaller(
        chains.ethereum,
        signerAddress,
        true
      );
      await executor.setWhitelistedProposalSender(
        chains.ethereum,
        signerAddress,
        true
      );

      const getPayload = (failedWithReason: boolean) => {
        const failedCallData = dummy.interface.encodeFunctionData("setState", [
          "Hello World",
        ]);
        const failedCallDataWithReason =
          dummy.interface.encodeFunctionData("kaboom");

        const calls = [
          {
            target: dummy.address,
            value: failedWithReason ? 0 : 1,
            callData: failedWithReason
              ? failedCallDataWithReason
              : failedCallData,
          },
        ];

        const payload = ethers.utils.defaultAbiCoder.encode(
          ["address", "tuple(address target, uint256 value, bytes callData)[]"],
          [signerAddress, calls]
        );

        return payload;
      };

      const broadcast = (payload: string) =>
        executor.forceExecute(chains.ethereum, signerAddress, payload);

      await expect(broadcast(getPayload(true))).to.be.revertedWith("kaboom");
      await expect(broadcast(getPayload(false))).to.be.revertedWithCustomError(
        executor,
        "ProposalExecuteFailed"
      );
    });
  });
});
