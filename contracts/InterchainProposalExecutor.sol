// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { Ownable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/utils/Ownable.sol';
import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IInterchainProposalExecutor } from './interfaces/IInterchainProposalExecutor.sol';
import { InterchainCalls } from './lib/InterchainCalls.sol';

/**
 * @title InterchainProposalExecutor
 * @dev This contract is intended to be the destination contract for `InterchainProposalSender` contract.
 * The proposal will be finally executed from this contract on the destination chain.
 *
 * The contract maintains whitelists for proposal senders and proposal callers. Proposal senders
 * are InterchainProposalSender contracts at the source chain and proposal callers are contracts
 * that call the InterchainProposalSender at the source chain.
 * For most governance system, the proposal caller should be the Timelock contract.
 *
 * Some functions need to be implemented in a derived contract.
 */
contract InterchainProposalExecutor is IInterchainProposalExecutor, AxelarExecutable, Ownable {
    // Whitelisted proposal callers. The proposal caller is the contract that calls the `InterchainProposalSender` at the source chain.
    mapping(string => mapping(bytes => bool)) public whitelistedCallers;

    // Whitelisted proposal senders. The proposal sender is the `InterchainProposalSender` contract address at the source chain.
    mapping(string => mapping(string => bool)) public whitelistedSenders;

    constructor(address _gateway, address _owner) AxelarExecutable(_gateway) Ownable(_owner) {}

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
        // Check that the source address is whitelisted
        if (!whitelistedSenders[sourceChain][sourceAddress]) {
            revert NotWhitelistedSourceAddress();
        }

        // Decode the payload
        (bytes memory sourceCaller, InterchainCalls.Call[] memory calls) = abi.decode(
            payload,
            (bytes, InterchainCalls.Call[])
        );

        // Check that the caller is whitelisted
        if (!whitelistedCallers[sourceChain][sourceCaller]) {
            revert NotWhitelistedCaller();
        }

        _beforeProposalExecuted(sourceChain, sourceAddress, sourceCaller, calls);

        // Execute the proposal with the given arguments
        _executeProposal(calls);

        _onProposalExecuted(sourceChain, sourceAddress, sourceCaller, payload);

        emit ProposalExecuted(keccak256(abi.encode(sourceChain, sourceAddress, sourceCaller, payload)));
    }

    /**
     * @dev Executes the proposal. Calls each target with the respective value, signature, and data.
     * @param calls The calls to execute.
     */
    function _executeProposal(InterchainCalls.Call[] memory calls) internal {
        uint256 length = calls.length;

        for (uint256 i = 0; i < length; i++) {
            InterchainCalls.Call memory call = calls[i];
            (bool success, bytes memory result) = call.target.call{ value: call.value }(call.callData);

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
        bytes memory sourceCaller,
        bool whitelisted
    ) external override onlyOwner {
        whitelistedCallers[sourceChain][sourceCaller] = whitelisted;
        emit WhitelistedProposalCallerSet(sourceChain, sourceCaller, whitelisted);
    }

    /**
     * @dev Set the proposal sender whitelist status
     * @param sourceChain The source chain
     * @param sourceSender The source sender
     * @param whitelisted The whitelist status
     */
    function setWhitelistedProposalSender(
        string calldata sourceChain,
        string calldata sourceSender,
        bool whitelisted
    ) external override onlyOwner {
        whitelistedSenders[sourceChain][sourceSender] = whitelisted;
        emit WhitelistedProposalSenderSet(sourceChain, sourceSender, whitelisted);
    }

    /**
     * @dev Receive native tokens for the proposal that requires native tokens.
     */
    receive() external payable {}

    /**
     * @dev A callback function that is called before the proposal is executed.
     * This function can be used to handle the payload before the proposal is executed.
     * @param sourceChain The source chain from where the proposal was sent.
     * @param sourceAddress The source address that sent the proposal. The source address should be the `InterchainProposalSender` contract address at the source chain.
     * @param caller The caller that calls the `InterchainProposalSender` at the source chain.
     * @param calls The array of `InterchainCalls.Call` to execute. Each call contains the target, value, and callData.
     */
    function _beforeProposalExecuted(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes memory caller,
        InterchainCalls.Call[] memory calls
    ) internal virtual {
        // You can add your own logic here to handle the payload before the proposal is executed.
    }

    /**
     * @dev A callback function that is called after the proposal is executed.
     * This function emits an event containing the hash of the payload to signify successful execution.
     * @param payload The payload. It is ABI encoded of the caller and calls.
     * Where:
     * - `caller` is the address that calls the `InterchainProposalSender` at the source chain.
     * - `calls` is the array of `InterchainCalls.Call` to execute. Each call contains the target, value, signature and data.
     */
    function _onProposalExecuted(
        string calldata /* sourceChain */,
        string calldata /* sourceAddress */,
        bytes memory /* caller */,
        bytes calldata payload
    ) internal virtual {
        // You can add your own logic here to handle the payload after the proposal is executed.
    }

    /**
     * @dev A callback function that is called when the execution of a target contract within a proposal fails.
     * This function will revert the transaction providing the failure reason if present in the failure data.
     * @param result The return data from the failed call to the target contract.
     */
    function _onTargetExecutionFailed(InterchainCalls.Call memory /* call */, bytes memory result) internal virtual {
        // You can add your own logic here to handle the failure of the target contract execution. The code below is just an example.
        if (result.length > 0) {
            // The failure data is a revert reason string.
            assembly {
                revert(add(32, result), mload(result))
            }
        } else {
            // There is no failure data, just revert with no reason.
            revert ProposalExecuteFailed();
        }
    }

    /**
     * @dev Called after a target is successfully executed. The derived contract should implement this function.
     * This function should do some post-execution work, such as emitting events.
     * @param call The call that has been executed.
     * @param result The result of the call.
     */
    function _onTargetExecuted(InterchainCalls.Call memory call, bytes memory result) internal virtual {
        // You can add your own logic here to handle the success of each target contract execution.
    }
}
