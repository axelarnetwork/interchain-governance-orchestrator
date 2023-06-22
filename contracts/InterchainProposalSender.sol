//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";
import "./interfaces/IProposalSender.sol";

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
     * @param destinationChains An array of destination chains
     * @param destinationContracts An array of destination contracts
     * @param fees An array of fees to pay for the interchain transaction
     * @param targets A 2d array of contracts to call. The first dimension is the destination chain index, the second dimension is the destination target contract index.
     * @param values A 2d array of amounts of native tokens to send. The first dimension is the destination chain index, the second dimension is the destination target contract index.
     * @param signatures A 2d array of function signatures to call. The first dimension is the destination chain index, the second dimension is the destination target contract index.
     * @param data A 2d array of encoded function arguments. The first dimension is the destination chain index, the second dimension is the destination target contract index.
     * Note that the destination chain must be unique in the destinationChains array.
     */
    function broadcastProposalToChains(
        string[] memory destinationChains,
        string[] memory destinationContracts,
        uint256[] memory fees,
        address[][] memory targets,
        uint256[][] memory values,
        string[][] memory signatures,
        bytes[][] memory data
    ) external payable override {
        // revert if the sum of given fees are not equal to the msg.value
        revertIfInvalidFee(fees);

        // revert if the length of given arrays are not equal
        revertIfInvalidLength(
            destinationChains,
            destinationContracts,
            fees,
            targets,
            values,
            signatures,
            data
        );

        for (uint i = 0; i < destinationChains.length; i++) {
            _broadcastProposalToChain(
                destinationChains[i],
                destinationContracts[i],
                fees[i],
                targets[i],
                values[i],
                signatures[i],
                data[i]
            );
        }
    }

    /**
     * @dev Broadcast the proposal to be executed at single destination chain.
     * @param destinationChain destination chain
     * @param destinationContract destination contract
     * @param targets An array of contracts to call
     * @param values An array of amounts of native tokens to send
     * @param signatures An array of function signatures
     * @param data An array of encoded function arguments
     */
    function broadcastProposalToChain(
        string memory destinationChain,
        string memory destinationContract,
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory data
    ) external payable {
        _broadcastProposalToChain(
            destinationChain,
            destinationContract,
            msg.value,
            targets,
            values,
            signatures,
            data
        );
    }

    function _broadcastProposalToChain(
        string memory destinationChain,
        string memory destinationContract,
        uint fee,
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory data
    ) internal {
        revertIfInvalidProposalArgs(targets, values, signatures, data);

        if (fee == 0) {
            revert InvalidFee();
        }

        bytes memory payload = abi.encode(
            msg.sender,
            targets,
            values,
            signatures,
            data
        );

        gasService.payNativeGasForContractCall{value: fee}(
            address(this),
            destinationChain,
            destinationContract,
            payload,
            msg.sender
        );

        gateway.callContract(destinationChain, destinationContract, payload);
    }

    function revertIfInvalidProposalArgs(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory data
    ) private pure {
        if (
            targets.length == 0 ||
            targets.length != values.length ||
            targets.length != signatures.length ||
            targets.length != data.length
        ) {
            revert ProposalArgsMisMatched();
        }
    }

    function revertIfInvalidLength(
        string[] memory destinationChains,
        string[] memory destinationContracts,
        uint[] memory fees,
        address[][] memory targets,
        uint256[][] memory values,
        string[][] memory signatures,
        bytes[][] memory data
    ) private pure {
        if (
            destinationChains.length != destinationContracts.length ||
            destinationChains.length != fees.length ||
            destinationChains.length != targets.length ||
            destinationChains.length != values.length ||
            destinationChains.length != signatures.length ||
            destinationChains.length != data.length
        ) {
            revert ArgsLengthMisMatched();
        }
    }

    function revertIfInvalidFee(uint[] memory fees) private {
        uint totalFees = 0;
        for (uint i = 0; i < fees.length; i++) {
            totalFees += fees[i];
        }

        if (totalFees != msg.value) {
            revert InvalidFee();
        }
    }
}
