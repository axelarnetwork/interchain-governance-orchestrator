import { task } from "hardhat/config";
import { AxelarQueryAPI, Environment } from "@axelar-network/axelarjs-sdk";
import {chains as testnetChains } from "@axelar-network/axelar-contract-deployments/info/testnet.json";
import {chains as mainnetChains} from "@axelar-network/axelar-contract-deployments/info/mainnet.json";
import { getDeploymentAddress, getInterchainProposalSenderAddress } from "./helpers/deployment";
import { InterchainProposalSender } from "../typechain-types";

task(
  "executeDummyState",
  "Update message on DummyState contract from source chain"
)
  .addPositionalParam("destinationChain")
  .addPositionalParam("message")
  .addOptionalPositionalParam("executorContractAddress")
  .addOptionalPositionalParam("dummyContractAddress")
  .setAction(async (taskArgs, hre) => {
    const {
      destinationChain,
      message,
      executorContractAddress: _executorContractAddress,
      dummyContractAddress: _dummyContractAddress,
    } = taskArgs;

    const executorContractAddress = _executorContractAddress || getDeploymentAddress(hre, "InterchainProposalExecutor", destinationChain);
    const dummyContractAddress = _dummyContractAddress || getDeploymentAddress(hre, "DummyState", destinationChain);
    const senderContractAddress = getInterchainProposalSenderAddress(hre.network.name);

    if(!senderContractAddress) {
      throw new Error(`InterchainProposalSender is not found on ${hre.network.name}`)
    }

    if(!executorContractAddress || !dummyContractAddress) {
      throw new Error("executorContractAddress or dummyContractAddress is not found")
    }

    const ethers = hre.ethers;

    const sender = await ethers.getContractAt<InterchainProposalSender>(
      "InterchainProposalSender",
      senderContractAddress
    );

    const callData = new ethers.utils.Interface([
      "function setState(string)",
    ]).encodeFunctionData("setState", [message]);

    const calls = [
      {
        target: dummyContractAddress,
        value: 0,
        callData,
      },
    ];

    // estimate gas fee
    const env =
      process.env.ENV === "mainnet" ? Environment.MAINNET : Environment.TESTNET;
    const queryApi = new AxelarQueryAPI({ environment: env });
    const chains = env === Environment.MAINNET ? mainnetChains : testnetChains;
    const chain = chains[hre.network.name];
    const gasFee = await queryApi.estimateGasFee(chain.id, destinationChain, chain.tokenSymbol);

    const tx = await sender.sendProposal(
      destinationChain,
      executorContractAddress,
      calls,
      {
        value: gasFee.toString(),
      }
    );

    console.log("Sent transaction hash:", tx.hash);
    const axelarscanUrl =
      env === Environment.MAINNET
        ? `https://axelarscan.io/gmp/${tx.hash}`
        : `https://testnet.axelarscan.io/gmp/${tx.hash}`;
    console.log("Continue tracking at axelarscan:", axelarscanUrl);
  });
