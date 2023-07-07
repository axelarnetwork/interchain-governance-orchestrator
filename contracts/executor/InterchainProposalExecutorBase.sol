// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@axelar-network/axelar-gmp-sdk-solidity/contracts/utils/AddressString.sol';
import '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import '../interfaces/IInterchainProposalExecutor.sol';
import '../lib/InterchainCalls.sol';

/**
 * @title InterchainProposalExecutorBase
 * @dev This contract is intended to be the destination contract for `InterchainProposalSender` contract.
 * The proposal will be finally executed from this contract on the destination chain.
 *
 * The contract maintains whitelists for proposal senders and proposal callers. Proposal senders
 * are InterchainProposalSender contracts at the source chain and proposal callers are contracts
 * that call the InterchainProposalSender at the source chain.
 * For most governance system, the proposal caller should be the Timelock contract.
 *
 * This contract is abstract and some of its functions need to be implemented in a derived contract.
 */
abstract contract InterchainProposalExecutorBase is
    IInterchainProposalExecutor,
    AxelarExecutable,
    Ownable
{
    // Whitelisted proposal callers. The proposal caller is the contract that calls the `InterchainProposalSender` at the source chain.
    mapping(string => mapping(address => bool)) public chainWhitelistedCallers;

    // Whitelisted proposal senders. The proposal sender is the `InterchainProposalSender` contract address at the source chain.
    mapping(string => mapping(address => bool)) public chainWhitelistedSender;

    constructor(address _gateway, address _owner) AxelarExecutable(_gateway) {
        _transferOwnership(_owner);
    }

    /**
     * @dev Executes the proposal. The source address must be a whitelisted sender.
     * @param sourceAddress The source address
     * @param payload The payload. It is ABI encoded of the caller and calls.
     * Where:
     * - `caller` is the address that calls the `InterchainProposalSender` at the source chain.
     * - `calls` is the array of `InterchainCalls.Call` to execute. Each call contains the target, value, signature and data.
     */
    function _execute(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        _beforeProposalExecuted(sourceChain, sourceAddress, payload);

        // Check that the source address is whitelisted
        if (
            !chainWhitelistedSender[sourceChain][
                StringToAddress.toAddress(sourceAddress)
            ]
        ) {
            revert NotWhitelistedSourceAddress();
        }

        // Decode the payload
        (
            address interchainProposalCaller,
            InterchainCalls.Call[] memory calls
        ) = abi.decode(payload, (address, InterchainCalls.Call[]));

        // Check that the caller is whitelisted
        if (!chainWhitelistedCallers[sourceChain][interchainProposalCaller]) {
            revert NotWhitelistedCaller();
        }

        // Execute the proposal with the given arguments
        _executeProposal(calls);

        _onProposalExecuted(sourceChain, sourceAddress, payload);
    }

    /**
     * @dev Executes the proposal. Calls each target with the respective value, signature, and data.
     * @param calls The calls to execute.
     */
    function _executeProposal(InterchainCalls.Call[] memory calls) internal {
        for (uint256 i = 0; i < calls.length; i++) {
            InterchainCalls.Call memory call = calls[i];
            (bool success, bytes memory result) = call.target.call{
                value: call.value
            }(call.callData);

            if (!success) {
                _onTargetExecutionFailed(call, result);
            } else {
                _onTargetExecuted(call, result);
            }
        }
    }

    /**
     * @dev Set the proposal caller whitelist status
     * @param sourceChain The source chain
     * @param sourceCaller The source caller
     * @param whitelisted The whitelist status
     */
    function setWhitelistedProposalCaller(
        string calldata sourceChain,
        address sourceCaller,
        bool whitelisted
    ) external override onlyOwner {
        chainWhitelistedCallers[sourceChain][sourceCaller] = whitelisted;
        emit WhitelistedProposalCallerSet(
            sourceChain,
            sourceCaller,
            whitelisted
        );
    }

    /**
     * @dev Set the proposal sender whitelist status
     * @param sourceChain The source chain
     * @param sourceSender The source sender
     * @param whitelisted The whitelist status
     */
    function setWhitelistedProposalSender(
        string calldata sourceChain,
        address sourceSender,
        bool whitelisted
    ) external override onlyOwner {
        chainWhitelistedSender[sourceChain][sourceSender] = whitelisted;
        emit WhitelistedProposalSenderSet(
            sourceChain,
            sourceSender,
            whitelisted
        );
    }

    /**
     * @dev Called after a proposal is executed. The derived contract should implement this function.
     * This function should do some post-execution work, such as emitting events.
     * @param sourceChain The source chain
     * @param sourceAddress The source address
     * @param payload The payload that has been executed.
     */
    function _onProposalExecuted(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal virtual;

    /**
     * @dev Called when the execution of a target has failed. The derived contract should implement this function.
     * This function should handle the failure. It could revert the transaction, ignore the failure, or do something else.
     * @param call The call that has been executed.
     * @param result The result of the call.
     */
    function _onTargetExecutionFailed(
        InterchainCalls.Call memory call,
        bytes memory result
    ) internal virtual;

    /**
     * @dev Called after a target is successfully executed. The derived contract should implement this function.
     * This function should do some post-execution work, such as emitting events.
     * @param call The call that has been executed.
     * @param result The result of the call.
     */
    function _onTargetExecuted(
        InterchainCalls.Call memory call,
        bytes memory result
    ) internal virtual;

    /**
     * @dev A callback function that is called before the proposal is executed.
     * This function can be used to handle the payload before the proposal is executed.
     * @param sourceChain The source chain from where the proposal was sent.
     * @param sourceAddress The source address that sent the proposal. The source address should be the `InterchainProposalSender` contract address at the source chain.
     * @param payload The payload. It is ABI encoded of the caller and calls.
     * Where:
     * - `caller` is the address that calls the `InterchainProposalSender` at the source chain.
     * - `calls` is the array of `InterchainCalls.Call` to execute. Each call contains the target, value, calldata.
     */
    function _beforeProposalExecuted(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal virtual;
}
