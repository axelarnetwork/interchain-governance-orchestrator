//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IProposalSender {
    /**
     * @dev A proposal to be executed at the destination chain
     * @param destinationChain destination chain
     * @param destinationContract destination contract
     * @param fee The amount of native token to transfer to the target contract
     * @param calls An array of calls to be executed at the destination chain
     */
    struct InterchainCall {
        string destinationChain;
        string destinationContract;
        uint256 fee;
        Call[] calls;
    }

    /**
     * @dev A call to be executed at the destination chain
     * @param target The address of the contract to call
     * @param value The amount of native token to transfer to the target contract
     * @param callData The data to pass to the target contract
     */
    struct Call {
        address target;
        uint256 value;
        bytes callData;
    }

    // An error emitted when the given fee is invalid
    error InvalidFee();

    /**
     * @dev Broadcast the proposal to be executed at multiple destination chains
     * @param calls An array of calls to be executed at the destination chain
     */
    function broadcastProposalToChains(
        InterchainCall[] memory calls
    ) external payable;

    /**
     * @dev Broadcast the proposal to be executed at single destination chain
     * @param destinationChain destination chain
     * @param destinationContract destination contract
     * @param calls An array of calls to be executed at the destination chain
     */
    function broadcastProposalToChain(
        string calldata destinationChain,
        string calldata destinationContract,
        Call[] calldata calls
    ) external payable;
}
