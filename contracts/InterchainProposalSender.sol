//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";
import "./interfaces/IProposalSender.sol";
import "./lib/InterchainStruct.sol";

/**
 * @title InterchainProposalSender
 * @dev This contract is responsible for facilitating the execution of approved proposals across multiple chains.
 * It achieves this by working in conjunction with the AxelarGateway and AxelarGasService contracts.
 *
 * The contract allows for the sending of a single proposal to multiple destination chains. This is achieved
 * through the `broadcastProposalToChains` function, which takes in arrays representing the destination chains,
 * destination contracts, fees, target contracts, amounts of tokens to send, function signatures, and encoded
 * function arguments.
 *
 * Each destination chain has a unique corresponding set of contracts to call, amounts of native tokens to send,
 * function signatures to call, and encoded function arguments. This information is provided in a 2D array where
 * the first dimension is the destination chain index, and the second dimension corresponds to the specific details
 * for each chain.
 *
 * In addition, the contract also allows for the execution of a single proposal at a single destination chain
 * through the `broadcastProposalToChain` function. This is a more granular approach and works similarly to the
 * aforementioned function but for a single destination.
 *
 * The contract ensures the correctness of the provided proposal details and fees through a series of internal
 * functions that revert the transaction if any of the checks fail. This includes checking if the provided fees
 * are equal to the total value sent with the transaction, if the lengths of the provided arrays match, and if the
 * provided proposal arguments are valid.
 *
 * The contract works in conjunction with the AxelarGateway and AxelarGasService contracts. It uses the
 * AxelarGasService contract to pay for the gas fees of the interchain transactions and the AxelarGateway
 * contract to call the target contracts on the destination chains with the provided encoded function arguments.
 */
contract InterchainProposalSender is IProposalSender {
    IAxelarGateway public gateway;
    IAxelarGasService public gasService;

    constructor(address _gateway, address _gasService) {
        gateway = IAxelarGateway(_gateway);
        gasService = IAxelarGasService(_gasService);
    }

    /**
     * @dev Broadcast the proposal to be executed at multiple destination chains
     * calls An array of calls to be executed at the destination chain
     * Note that the destination chain must be unique in the destinationChains array.
     */
    function broadcastProposalToChains(
        InterchainStruct.XCall[] calldata xCalls
    ) external payable override {
        // revert if the sum of given fees are not equal to the msg.value
        revertIfInvalidFee(xCalls);

        for (uint i = 0; i < xCalls.length; ) {
            _broadcastProposalToChain(xCalls[i]);
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Broadcast the proposal to be executed at single destination chain.
     * @param destinationChain destination chain
     * @param destinationContract destination contract
     * @param calls An array of calls to be executed at the destination chain
     */
    function broadcastProposalToChain(
        string memory destinationChain,
        string memory destinationContract,
        InterchainStruct.Call[] calldata calls
    ) external payable override {
        _broadcastProposalToChain(
            InterchainStruct.XCall(
                destinationChain,
                destinationContract,
                msg.value,
                calls
            )
        );
    }

    function _broadcastProposalToChain(
        InterchainStruct.XCall memory xCall
    ) internal {
        if (xCall.fee == 0) {
            revert InvalidFee();
        }

        bytes memory payload = abi.encode(msg.sender, xCall.calls);

        gasService.payNativeGasForContractCall{value: xCall.fee}(
            address(this),
            xCall.destinationChain,
            xCall.destinationContract,
            payload,
            msg.sender
        );

        gateway.callContract(
            xCall.destinationChain,
            xCall.destinationContract,
            payload
        );
    }

    function revertIfInvalidFee(
        InterchainStruct.XCall[] calldata xCalls
    ) private {
        uint totalFees = 0;
        for (uint i = 0; i < xCalls.length; ) {
            totalFees += xCalls[i].fee;
            unchecked {
                ++i;
            }
        }

        if (totalFees != msg.value) {
            revert InvalidFee();
        }
    }
}
