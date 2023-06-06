//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IProposalSender {
    // An error emitted when the given arguments to executeRemoteProposal function is invalid
    error InvalidArgs();

    /**
     * @notice Send the proposal to the destination chain via Axelar Gateway
     * @param destinationChain The destination chain
     * @param destinationContract The destination contract address. The contract must implement the `IProposalExecutor` interface
     * @param targets An array of contracts to call
     * @param values An array of amounts of native tokens to send
     * @param signatures An array of function signatures to call
     * @param data An array of encoded function arguments.
     */
    function executeRemoteProposal(
        string memory destinationChain,
        string memory destinationContract,
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory data
    ) external payable;
}
