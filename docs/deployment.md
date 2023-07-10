# Deployment Guide

Welcome to this comprehensive guide that outlines the deployment process for `InterchainProposalExecutor` and (optionally) `InterchainProposalSender` contracts. We aim to ensure a seamless and reliable deployment experience.

Our deployment script adopts the `CREATE3` approach, an innovative strategy that ensures the deployed contract address remains consistent across varying EVM chains.

This methodology enhances consistency and synchronization across chains, streamlining the deployment process and reducing the complexity of contract management.

Let's dive into the steps required.

## Prerequisites

Before we begin, ensure the following steps are complete:

1. Install the necessary packages using the command: `yarn install`.
2. Set up config variables. This can be done by creating a `/info/keys.json` file based on the provided `/info/keys.example.json`.

## Deployment Steps

Here are the steps to deploy the contracts:

- To deploy the `InterchainProposalExecutor` contract exclusively, use the following command:

```bash
 yarn deploy --tags InterchainProposalExecutor --network {chainName}
```

- To deploy both `InterchainProposalExecutor` and `InterchainProposalSender` contracts, use the following command:

```bash
yarn deploy --network {chainName}
```

## Contract Verification

To verify your contract, run the following command:

```bash
yarn deploy --tags Verify --network {chainName}
```

## Setting Up the InterchainProposalExecutor Contract

You may need to whitelist certain contracts for your `InterchainProposalExecutor` contract. Here's how you can do that:

1. To whitelist the `InterchainProposalSender` contract, use the following command:

Replace `{sourceChain}`, `{sourceSenderAddress}`, and `{chainName}` with your respective chain name, sender address, and network name.

```bash
yarn task whitelistSender {sourceChain} {sourceSenderAddress} --network {chainName}
```

2. To whitelist the caller that calls the `InterchainProposalSender` contract (usually a `Timelock` contract), use the following command:

Replace `{sourceChain}`, `{sourceCallerAddress}`, and `{chainName}` with your respective chain name, caller address, and network name.

```bash
yarn task whitelistCaller {sourceChain} {sourceCallerAddress} --network {chainName}
```

Note: the chain name is case-sensitive, you must use the following doc as a reference:

- testnet: https://docs.axelar.dev/dev/reference/testnet-chain-names
- mainnet: https://docs.axelar.dev/dev/reference/mainnet-chain-names

## Test functionalities

To test if your deployment works end-to-end from initiating the interchain proposal to Axelar at the source chain, to execution at the destination chain, we'll need to have some contract to execute proposal code. To keep it simple, we can use a `DummyState` contract [here](../contracts/test/DummyState.sol).

We'll update the `message` with the interchain call from the source chain. If the message is updated correctly, our deployment is working.

1. Deploy the `DummyState` contract

```bash
yarn deploy --tags DummyState --network {chainName}
```

2. Initiate the interchain call



## Supported Networks

Testnet: https://docs.axelar.dev/resources/testnet
Mainnet: https://docs.axelar.dev/resources/mainnet
