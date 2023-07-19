import hre, { ethers } from 'hardhat';
import {
  IAxelarGasService,
  IAxelarGateway,
  InterchainProposalSender,
  InterchainProposalSender__factory as InterchainProposalSenderFactory,
} from '../../typechain-types';
import { contracts } from '../../constants';
import { chains } from '../../constants/chains';
import { expect } from 'chai';
import { BigNumberish, Contract, Signer } from 'ethers';

describe('InterchainProposalSender', function () {
  let sender: InterchainProposalSender;
  let signer: Signer;
  let signerAddress: string;
  let gasService: Contract;
  let gateway: Contract;

  // redefine "slow" test for this test suite
  this.slow(10000);
  this.timeout(15000);

  beforeEach(async () => {
    [signer] = await ethers.getSigners();
    signerAddress = await signer.getAddress();
    const senderFactory = await ethers.getContractFactory(
      'InterchainProposalSender',
    );
    sender = (await senderFactory.deploy(
      contracts[chains.hardhat].gateway,
      contracts[chains.hardhat].gasService,
    )) as InterchainProposalSender;

    gasService = await ethers.getContractAt(
      'IAxelarGasService',
      contracts[chains.hardhat].gasService,
    );

    gateway = await ethers.getContractAt(
      'IAxelarGateway',
      contracts[chains.hardhat].gateway,
    );
  });

  describe('deployment', function () {
    it('should revert if given gateway or gasService address is zero', async () => {
      const senderFactory = await ethers.getContractFactory(
        'InterchainProposalSender',
      );
      await expect(
        senderFactory.deploy(
          ethers.constants.AddressZero,
          contracts[chains.hardhat].gasService,
        ),
      ).to.be.revertedWithCustomError(sender, 'InvalidAddress');

      await expect(
        senderFactory.deploy(
          contracts[chains.hardhat].gateway,
          ethers.constants.AddressZero,
        ),
      ).to.be.revertedWithCustomError(sender, 'InvalidAddress');
    });
  });

  describe('sendProposal', function () {
    it('should be able to call gateway and gasService contracts successfully', async function () {
      const target = await ethers
        .getSigners()
        .then((signers) => signers[1].getAddress());

      const calls = [
        {
          target,
          value: 0,
          callData: ethers.utils.randomBytes(32),
        },
        {
          target,
          value: 1,
          callData: ethers.utils.randomBytes(32),
        },
        {
          target,
          value: 2,
          callData: ethers.utils.randomBytes(32),
        },
      ];

      const broadcast = () =>
        sender.sendProposal(
          chains.avalanche,
          ethers.constants.AddressZero,
          calls,
          { value: 1 },
        );

      const payload = ethers.utils.defaultAbiCoder.encode(
        ['address', 'tuple(address target, uint256 value, bytes callData)[]'],
        [signerAddress, calls],
      );

      const payloadHash = ethers.utils.keccak256(payload);

      await expect(broadcast())
        .to.emit(
          gasService,
          'NativeGasPaidForContractCall(address,string,string,bytes32,uint256,address)',
        )
        .withArgs(
          sender.address,
          chains.avalanche,
          ethers.constants.AddressZero,
          payloadHash,
          1,
          await signer.getAddress(),
        );

      await expect(broadcast())
        .to.emit(gateway, 'ContractCall(address,string,string,bytes32,bytes)')
        .withArgs(
          sender.address,
          chains.avalanche,
          ethers.constants.AddressZero,
          payloadHash,
          payload,
        );
    });

    it('should not pay gas fee if msg.value is 0', async function () {
      const target = await ethers
        .getSigners()
        .then((signers) => signers[1].getAddress());

      const calls = [
        {
          target,
          value: 0,
          callData: ethers.utils.randomBytes(32),
        },
      ];

      const broadcast = () =>
        sender.sendProposal(
          chains.avalanche,
          ethers.constants.AddressZero,
          calls,
          { value: 0 },
        );

      await expect(broadcast()).to.not.emit(
        gasService,
        'NativeGasPaidForContractCall(address,string,string,bytes32,uint256,address)',
      );
    });
  });

  describe('sendProposals', function () {
    it('should be able to call gateway and gasService contracts successfully', async function () {
      const target = await ethers
        .getSigners()
        .then((signers) => signers[1].getAddress());

      const calls = [
        {
          target,
          value: 0,
          callData: ethers.utils.randomBytes(32),
        },
        {
          target,
          value: 1,
          callData: ethers.utils.randomBytes(32),
        },
        {
          target,
          value: 2,
          callData: ethers.utils.randomBytes(32),
        },
      ];

      const destChains = ['avalanche', 'binance'];

      const xCalls = [
        {
          destinationChain: destChains[0],
          destinationContract: ethers.constants.AddressZero,
          gas: 1,
          calls,
        },
        {
          destinationChain: destChains[1],
          destinationContract: ethers.constants.AddressZero,
          gas: 1,
          calls,
        },
      ];

      const broadcast = () => sender.sendProposals(xCalls, { value: 2 });

      const payload = ethers.utils.defaultAbiCoder.encode(
        ['address', 'tuple(address target, uint256 value, bytes callData)[]'],
        [signerAddress, calls],
      );

      const payloadHash = ethers.utils.keccak256(payload);

      for (const destChain of destChains) {
        await expect(broadcast())
          .to.emit(
            gasService,
            'NativeGasPaidForContractCall(address,string,string,bytes32,uint256,address)',
          )
          .withArgs(
            sender.address,
            destChain,
            ethers.constants.AddressZero,
            payloadHash,
            1,
            signerAddress,
          );

        await expect(broadcast())
          .to.emit(gateway, 'ContractCall(address,string,string,bytes32,bytes)')
          .withArgs(
            sender.address,
            destChain,
            ethers.constants.AddressZero,
            payloadHash,
            payload,
          );
      }

      const senderContractBalance = await hre.ethers.provider.getBalance(
        sender.address,
      );
      expect(senderContractBalance).to.equal(0);
    });

    it('should be reverted with InvalidFee', async function () {
      const target = await ethers
        .getSigners()
        .then((signers) => signers[1].getAddress());

      const calls = [
        {
          target,
          value: 0,
          callData: ethers.utils.randomBytes(32),
        },
      ];

      const destChains = ['avalanche', 'binance'];

      const xCalls = [
        {
          destinationChain: destChains[0],
          destinationContract: ethers.constants.AddressZero,
          gas: 1,
          calls,
        },
        {
          destinationChain: destChains[1],
          destinationContract: ethers.constants.AddressZero,
          gas: 1,
          calls,
        },
      ];

      const broadcast = async (value: BigNumberish) =>
        sender.sendProposals(xCalls, { value });

      // should be reverted because the fee is overpaid
      await expect(broadcast(1000)).to.be.revertedWithCustomError(
        sender,
        'InvalidFee',
      );

      // should be reverted because the fee is not enough
      await expect(broadcast(0)).to.be.reverted;
    });
  });
});
