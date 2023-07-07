# Sample Code for Creating an Interchain Proposal

This document outlines how to create a proposal that sets a new string value in a [DummyState.sol](contracts/test/DummyState.sol) deployed on `Avalanche` from `Ethereum`.

## Prerequisites

You must have deployed instances of `InterchainProposalSender` and `ProposalExecutor`. Your `InterchainProposalSender` must be whitelisted for the `ProposalExecutor`.

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
const ProposalExecutorAddressOnAvalanche =
  "0xProposalExecutorAddressOnAvalanche";
const GovernorAlphaAddressOnEthereum = "0xGovernorAlphaAddressOnEthereum";
const InterchainProposalSenderAddressOnEthereum =
  "0xInterchainProposalSenderAddressOnEthereum";

// Set up your wallet
const signer = new ethers.Wallet("YOUR_EVM_PRIVATE_KEY");

// Initialize the contracts
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

### 3. Choose Which Chains Will Execute the Proposal

You can opt to execute your proposal on a single destination chain or multiple chains.

#### Single Destination Chain

**Proposal Payload Encoding**

```ts
const proposalExecutions = [
  {
    target: dummyState.address,
    value: 0,
    callData: new ethers.utils.Interface([
      "function setState(string)",
    ]).encodeFunctionData("setState", ["Hello World"]),
  },
];
```

This step encodes the proposal payload, which is then dispatched to the destination chain. This payload represents the specific transaction you want to execute.

**Proposing Transaction to the Governor Contract**

```ts
// Propose the payload to the Governor contract
await governorAlphaContract.propose(
  [sender.address],
  [relayerFee], // The `relayerFee` from step 2 is used here.
  ["sendProposal(string,string,(address,uint256,bytes)[])"],
  [
    ethers.utils.defaultAbiCoder.encode(
      ["string", "string", "(address target, uint256 value, bytes callData)[]"],
      ["Avalanche", ProposalExecutorAddressOnAvalanche, proposalExecutions]
    ),
  ],
  `A proposal to set "Hello World" message at Avalanche chain`
);
```

#### Multiple Destination Chains

If you wish to propose to multiple chains, use a similar approach to the single destination chain, but use the `sendProposals` function like the following:

```ts
const proposalExecutions = [
  {
    destinationChain: "Avalanche",
    destinationContract: ProposalExecutorAddressOnAvalanche,
    fee: ethers.utils.parseEther(relayerFee),
    calls: [
      {
        target: dummyState.address,
        value: 0,
        callData: new ethers.utils.Interface([
          "function setState(string)",
        ]).encodeFunctionData("setState", ["Hello World"]),
      },
    ],
  },
  {
    destinationChain: "Fantom",
    destinationContract: ProposalExecutorAddressOnFantom,
    fee: ethers.utils.parseEther(relayerFee2), // Note that the relayer fee must be calculated separately for each execution.
    calls: [
      {
        target: dummyState.address,
        value: 0,
        callData: new ethers.utils.Interface([
          "function setState(string)",
        ]).encodeFunctionData("setState", ["Hello World"]),
      },
    ],
  },
];
```

**Proposing Transaction to the Governor Contract**

```ts
// Propose the payload to the Governor contract
await governorAlphaContract.propose(
  [sender.address],
  [relayerFee], // The `relayerFee` from step 2 is used here.
  [
    "sendProposals((string,string,uint256,(address,uint256,bytes)[])[])",
  ],
  [
    ethers.utils.defaultAbiCoder.encode(
      [
        "(string destinationChain,string destinationContract,uint256 fee,(address target,uint256 value,bytes callData)[] calls)[]",
      ],
      [proposalExecutions]
    ),
  ],
  `A proposal to set "Hello World" message at Avalanche chain and Fantom chain`
);
```

This results in the proposal payload being submitted to the Governor contract, which triggers the subsequent stages of voting, queuing, and execution. This culminates in the invocation of the `sendProposal` or `sendProposals` function on the `InterchainProposalSender` contract on Ethereum, setting off the interchain method call.

## Summary

The sample code snippet instructs the `InterchainProposalSender` contract on Ethereum to initiate an interchain method call via the Axelar Network. Specifically, the proposal aims to alter the `DummyContract.sol` on Avalanche, updating a string to "Hello World". Upon proposal creation, it follows the typical governance process.
