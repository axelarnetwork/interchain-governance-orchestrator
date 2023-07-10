import { task } from "hardhat/config";
import { InterchainProposalExecutor } from "../typechain-types/contracts/InterchainProposalExecutor";
import {
  DummyState__factory,
  InterchainProposalSender,
} from "../typechain-types";
import { AxelarQueryAPI, Environment } from "@axelar-network/axelarjs-sdk";

task(
  "executeDummyState",
  "Update message on DummyState contract from source chain"
)
  .addPositionalParam("destinationChain")
  .addPositionalParam("executorContractAddress")
  .addPositionalParam("dummyContractAddress")
  .addPositionalParam("message")
  .setAction(async (taskArgs, hre) => {
    const {
      destinationChain,
      executorContractAddress,
      dummyContractAddress,
      message,
    } = taskArgs;

    const ethers = hre.ethers;

    const sender = await ethers.getContract<InterchainProposalSender>(
      "InterchainProposalSender"
    );

    const callData = DummyState__factory.createInterface().encodeFunctionData(
      "setState",
      [message]
    );

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
    queryApi.estimateGasFee(hre.network.name, destinationChain, )

    const tx = await sender.sendProposal(
      destinationChain,
      executorContractAddress,
      calls
    );

    console.log("Sent transaction hash:", tx.hash);
    const axelarscanUrl =
      env === Environment.MAINNET
        ? `https://axelarscan.io/gmp/${tx.hash}`
        : `https://testnet.axelarscan.io/gmp/${tx.hash}`;
    console.log("Continue tracking at axelarscan:", axelarscanUrl);
  });
