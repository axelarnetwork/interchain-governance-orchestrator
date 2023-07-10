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

## Test Deployment

To confirm the successful deployment and functioning of your contracts, conduct an end-to-end test from initiating an interchain proposal on the source chain to its execution on the destination chain. Use the DummyState contract [here](../contracts/test/DummyState.sol) to execute the proposal code. If the message updates correctly, the deployment is operational.

1. Deploy the `DummyState` contract to the same chain as the `InterchainProposalExecutor` contract.

```bash
yarn deploy --tags DummyState --network {chainName}
```

2. Confirm the accuracy of whitelisted addresses:

- The whitelisted sender should reference the `InterchainProposalSender` contract.
- The whitelisted caller should reference your signer account provided in `/info/keys.json`.

Remember: chain names are case-sensitive.

3. Initiate the `executeDummyState` task on the source chain:

```bash
yarn task executeDummyState {destinationChain} {message} --network {srcChainName}
```

This command sends a test proposal to the `InterchainProposalSender` contract to update the `DummyState` contract message on the destination chain. You can track the execution status via the axelarscan link printed upon completion.

4. Verify the DummyState message

Upon execution completion, check the `DummyState` contract message on the destination chain using:

```bash
yarn task readDummyState --network {destinationChain}
```

If the message updates successfully, your contract is functioning correctly.

## Supported Networks

Testnet: https://docs.axelar.dev/resources/testnet
Mainnet: https://docs.axelar.dev/resources/mainnet
