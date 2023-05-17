import { Contract, ethers } from "ethers";

export const waitProposalExecuted = (
  timelockAddress: string,
  payload: string,
  executorContract: Contract
) =>
  new Promise((resolve, reject) => {
    const encodedSenderPayload = ethers.utils.defaultAbiCoder.encode(
      ["address", "bytes"],
      [timelockAddress, payload]
    );
    executorContract.on(
      executorContract.filters.ProposalExecuted(
        ethers.utils.keccak256(encodedSenderPayload)
      ),
      (payloadHash) => {
        resolve(payloadHash);
      }
    );
  });
