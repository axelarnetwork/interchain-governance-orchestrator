import { Contract, ethers } from "ethers";

export const waitProposalExecuted = (
  sourceChain: string,
  sourceAddress: string,
  payload: string,
  caller: string,
  executorContract: Contract
) =>
  new Promise((resolve, reject) => {
    executorContract.on(
      executorContract.filters.ProposalExecuted(
        ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ["string", "string", "address", "bytes"],
            [sourceChain, sourceAddress, caller, payload]
          )
        )
      ),
      (payloadHash) => {
        resolve(payloadHash);
      }
    );
  });
