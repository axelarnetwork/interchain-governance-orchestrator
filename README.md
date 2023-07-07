# Axelar Interchain Governance Executor

Axelar Interchain Governance Executor is a project that enhances on-chain governance protocols to facilitate interchain proposal execution. We demonstrate the extension using Compound's governance contracts, but the approach can be applied to any governance protocol.

## Key Components

There are two essential contracts in this interchain extension:

1. `InterchainProposalSender`: Deployed on the source chain, this contract has a method called `sendProposal`. This method encodes a proposal into a payload for a remote chain and pays the Axelar Gas Service for the execution of the interchain call on the destination chain.

2. `ProposalExecutor`: Deployed on the destination chain, this contract has a callback method `_execute` that executes the proposal on the target contracts.

For a visual transaction flow of the interchain proposal, see the mermaid diagram below.

```mermaid
flowchart
    subgraph "Destination Chain Contracts"
        direction TB
        PE{{ProposalExecutor Contract}}
        PE -.->|Calls| TargetA
        PE -->|Calls| TargetB
        PE -.->|Calls| Target
        TargetA[Contract ..]
        TargetB[Contract A]
        Target[Contract ..]
    end

    subgraph "Axelar Interchain Proposal Sender"
        direction TB
        IPS -->|Encode & Submit| AxelarGateway
        AxelarGateway -.->|Emit Events| Relayer
        Relayer -.->|Execute| PE
    end

    subgraph "Source Chain Governance"
        direction TB
        Dev -->|Propose| Gov[Governor Contract]
        Gov -->|Vote & Queue| Timelock[Timelock Contract]
        Timelock -.->|Execute Proposal| IPS{{InterchainProposalSender Contract}}
    end
```

## Getting Started

Get up and running with integrating your governance system using Axelar. Here are a few approaches to help you understand the process:

### Prerequisite

- Requires Node v16

### 1. Local Testing

To get a feel for the process, start by running local tests. This will help you understand the expected behavior of the system:

```shell
yarn install
yarn test
```

### 2. Code Review and Experimentation

Understand the codebase better by checking out our sample code. It provides an example of creating a proposal, such as updating a state variable in the [DummyState.sol](contracts/test/DummyState.sol) contract on `Avalanche` from `Ethereum`. You can find this in [sample.md](docs/sample.md).

### 3. Integration

Once you're comfortable with the process, use the deployed addresses to integrate your governance system with Axelar.

## Interchain Proposal Execution

In order to execute interchain proposals, deploy your instance of `InterchainProposalSender`. Alternatively, use our predefined contract for the testnet listed below. On the destination chain, deploy `ProposalExecutor` and set up access control for whitelisted senders from the source chain.

| Chain     | InterchainProposalSender address           |
| --------- | ------------------------------------------ |
| Avalanche | 0x1DD07197f721F34659923ec54af8cb997eBD255e |
| Ethereum  | 0x1DD07197f721F34659923ec54af8cb997eBD255e |
| Polygon   | 0x1DD07197f721F34659923ec54af8cb997eBD255e |
| Moonbeam  | 0x1DD07197f721F34659923ec54af8cb997eBD255e |
| Fantom    | 0x1DD07197f721F34659923ec54af8cb997eBD255e |

## Deployment Guide

To learn more about the deployment process, please follows [this guide](docs/deployment.md)
