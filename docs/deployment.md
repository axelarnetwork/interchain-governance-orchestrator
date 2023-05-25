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
 yarn deploy --tags InterchainProposalExecutor
```

- To deploy both `InterchainProposalExecutor` and `InterchainProposalSender` contracts, use the following command:

```bash
yarn deploy
```

## Supported Networks

The contracts can be deployed to the following networks:

- Ethereum
- Moonbeam
- Avalanche
- Fantom
- Polygon

Interested in deploying on another chain? Feel free to add more chain configurations in the `hardhat.config.ts` file.


