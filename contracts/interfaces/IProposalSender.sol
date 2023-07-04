//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../lib/InterchainStruct.sol";

interface IProposalSender {
    // An error emitted when the given fee is invalid
    error InvalidFee();

    /**
     * @dev Broadcast the proposal to be executed at multiple destination chains
     * @param calls An array of calls to be executed at the destination chain
     */
    function broadcastProposalToChains(
        InterchainStruct.XCall[] memory calls
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
        InterchainStruct.Call[] calldata calls
    ) external payable;
}
