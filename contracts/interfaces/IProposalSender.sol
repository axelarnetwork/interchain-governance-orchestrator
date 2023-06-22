//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IProposalSender {
    // An error emitted when the given arguments to broadcastProposalToChain function is invalid
    error ProposalArgsMisMatched();

    // An error emitted when the given arguments to broadcastProposalToChains function is invalid
    error ArgsLengthMisMatched();

    // An error emitted when the given fee is invalid
    error InvalidFee();

    /**
     * @dev Broadcast the proposal to be executed at multiple destination chains
     * @param destinationChains The destination chain
     * @param destinationContracts The destination contract address. The contract must implement the `IProposalExecutor` interfacea
     * @param fees The fee to pay for the interchain transaction
     * @param targets An array of contracts to call
     * @param values An array of amounts of native tokens to send
     * @param signatures An array of function signatures to call
     * @param data An array of encoded function arguments.
     */
    function broadcastProposalToChains(
        string[] memory destinationChains,
        string[] memory destinationContracts,
        uint[] memory fees,
        address[][] memory targets,
        uint256[][] memory values,
        string[][] memory signatures,
        bytes[][] memory data
    ) external payable;

    /**
     * @dev Broadcast the proposal to be executed at single destination chain
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
    ) external payable;
}
