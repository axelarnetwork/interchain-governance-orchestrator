# Deployment Guide

This guide will walk you through the process of deploying `InterchainProposalExecutor` and `InterchainProposalSender` contracts.

## Prerequisites

Before starting, make sure to complete the following steps:

1. Install necessary packages using the command: `yarn install`.
2. Set up the environment variables. This can be done by creating a `.env` file based on the provided `.env.example`.

## Deployment Steps

Here's how you can deploy the contracts:

- To deploy the `InterchainProposalExecutor` contract only, use the following command:

```bash
 yarn deploy --tags InterchainProposalExecutor --network {chainName}
```

- To deploy both `InterchainProposalExecutor` and `InterchainProposalSender` contracts, use the following command:

```bash
yarn deploy --network {chainName}
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

## Supported Networks

The contracts can be deployed to the following networks:

- Ethereum
- Moonbeam
- Avalanche
- Fantom
- Polygon

Interested in deploying on another chain? Feel free to add more chain configurations in the `hardhat.config.ts` file.
