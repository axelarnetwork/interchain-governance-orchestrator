import { Contract, ethers } from "ethers";

export const waitProposalExecuted = (
  payload: string,
  executorContract: Contract
) =>
  new Promise((resolve, reject) => {
    executorContract.on(
      executorContract.filters.ProposalExecuted(
        ethers.utils.keccak256(payload)
      ),
      (payloadHash) => {
        resolve(payloadHash);
      }
    );
  });
