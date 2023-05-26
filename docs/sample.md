# Sample Code for Creating an Interchain Proposal

This document outlines how to create a proposal that sets a new string value in a [DummyState.sol](contracts/test/DummyState.sol) deployed on `Avalanche` from `Ethereum`.

## Prerequisites

You must have deployed instances of `InterchainProposalSender` and `InterchainProposalExecutor`. Your `InterchainProposalSender` must be whitelisted for the `InterchainProposalExecutor`.

## Code Snippet

### 1. Wallet and Contract Setup

```ts
import { Contract, Wallet } from "ethers";
import {
  CHAINS,
  Environment,
  AxelarQueryAPI,
} from "@axelar-network/axelarjs-sdk";

// ABI for the relevant contracts
const senderABI = [...];
const governorAlphaABI = [...];

// Contract addresses
const DummyContractAddressOnAvalanche = "0xDummyContractAddressOnAvalanche";
const InterchainProposalExecutorAddressOnAvalanche =
  "0xInterchainProposalExecutorAddressOnAvalanche";
const GovernorAlphaAddressOnEthereum = "0xGovernorAlphaAddressOnEthereum";
const InterchainProposalSenderAddressOnEthereum =
  "0xInterchainProposalSenderAddressOnEthereum";

// Wallet setup
const signer = new ethers.Wallet("YOUR_EVM_PRIVATE_KEY");

// Contracts setup
const governorAlphaContract = new Contract(
  GovernorAlphaAddressOnEthereum,
  governorAlphaABI,
  signer
);
const sender = new Contract(
  InterchainProposalSenderAddressOnEthereum,
  senderABI,
  signer
);
```

This part of the script sets up your wallet and initializes the `GovernorAlpha` and `InterchainProposalSender` contracts on Ethereum.

### 2. Gas Fee Estimation

```ts
// Axelar API setup for gas fee estimation
const axelarApi = new AxelarQueryAPI({ environment: Environment.MAINNET });

// Estimate Axelar Relayer fee for execution on the destination chain
const relayerFee = await axelarApi.estimateGasFee(
  CHAINS.MAINNET.ETHEREUM,
  CHAINS.MAINNET.AVALANCHE,
  GasToken.ETH,
  1_000_000, // Estimated gas limit needed for executing your transaction on the destination chain
  1.2, // Multiplier for overestimation
  undefined
);
```

Here, the script estimates the gas fee for the execution of your transaction on the destination chain using Axelar API.

### 3. Proposal Payload Encoding

```ts
// Payload for the destination chain
const proposalPayload = ethers.utils.defaultAbiCoder.encode(
  ["address[]", "uint256[]", "string[]", "bytes[]"],
  [
    [DummyContractAddressOnAvalanche],
    [0],
    ["setState(string)"],
    [ethers.utils.defaultAbiCoder.encode(["string"], ["Hello World"])],
  ]
);
```

In this section, the proposal payload to be dispatched to the destination chain is encoded. This payload represents your specific transaction.

### 4. Proposing Transaction to the Governor Contract

```ts
// Propose the payload to the Governor contract
await governorAlphaContract.propose(
  [sender.address],
  [relayerFee], // Use the `relayerFee` retrieved at the [Step 2](#2-gas-fee-estimation) here.
  ["executeRemoteProposal(string,string,bytes)"],
  [
    ethers.utils.defaultAbiCoder.encode(
      ["string", "string", "bytes"],
      [
        "Avalanche",
        InterchainProposalExecutorAddressOnAvalanche,
        proposalPayload,
      ]
    ),
  ],
  `A proposal to set "Hello World" message at Avalanche chain`
);
```

Ultimately, the proposal payload is submitted to the Governor contract, setting off a series of events: `voting`, `queuing`, and `execution`. The culmination of this process is the invocation of the `executeRemoteProposal` function on the `InterchainProposalSender` contract on `Ethereum`, thus initiating the interchain method call.

## Summary

The snippet generates a proposal for the `GovernorAlpha` contract. This proposal requests the `InterchainProposalSender` contract on Ethereum to dispatch a interchain method via Axelar Network. Specifically, it seeks to modify the `DummyContract.sol` on Avalanche, updating a string to "Hello World". Following proposal creation, it undergoes standard governance procedures.
