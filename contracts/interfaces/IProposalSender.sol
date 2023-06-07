//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IProposalSender {
    // An error emitted when the given arguments to executeRemoteProposal function is invalid
    error ProposalArgsMisMatched();

    error ArgsLengthMisMatched();

    // An error emitted when the given fee is invalid
    error InvalidFee();

    /**
     * @notice Send the proposal to the destination chain via Axelar Gateway
     * @param destinationChains The destination chain
     * @param destinationContracts The destination contract address. The contract must implement the `IProposalExecutor` interfacea
     * @param fees The fee to pay for the interchain transaction
     * @param targets An array of contracts to call
     * @param values An array of amounts of native tokens to send
     * @param signatures An array of function signatures to call
     * @param data An array of encoded function arguments.
     */
    function batchExecuteRemoteProposal(
        string[] memory destinationChains,
        string[] memory destinationContracts,
        uint[] memory fees,
        address[][] memory targets,
        uint256[][] memory values,
        string[][] memory signatures,
        bytes[][] memory data
    ) external payable;

    /**
     * @dev Execute an approved proposal at a single destination chain
     * @param destinationChain destination chain
     * @param destinationContract destination contract
     * @param targets An array of contracts to call
     * @param values An array of amounts of native tokens to send
     * @param signatures An array of function signatures
     * @param data An array of encoded function arguments
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
