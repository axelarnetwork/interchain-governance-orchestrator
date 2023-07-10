import { task } from "hardhat/config";
import { InterchainProposalExecutor } from "../typechain-types/contracts/InterchainProposalExecutor";
import {
  DummyState__factory,
  InterchainProposalSender,
} from "../typechain-types";
import { AxelarQueryAPI, Environment } from "@axelar-network/axelarjs-sdk";
import {chains as testnetChains } from "@axelar-network/axelar-contract-deployments/info/testnet.json";
import {chains as mainnetChains} from "@axelar-network/axelar-contract-deployments/info/mainnet.json";
import { getDeploymentAddress } from "./helpers/deployment";

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

    if(!executorContractAddress || !dummyContractAddress) {
      throw new Error("executorContractAddress or dummyContractAddress is not found")
    }

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
