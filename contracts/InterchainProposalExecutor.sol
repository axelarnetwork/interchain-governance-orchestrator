//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarExecutable.sol';
import '@axelar-network/axelar-gmp-sdk-solidity/contracts/utils/AddressString.sol';
import './executor/InterchainProposalExecutorBase.sol';
import './lib/InterchainCalls.sol';

/**
 * @title InterchainProposalExecutor
 * @dev This contract provides a simple implementation of the `InterchainProposalExecutorBase` abstract contract.
 * It offers specific logic for handling proposal execution success and failures as well as emitting events
 * after proposal execution.
 */
contract InterchainProposalExecutor is InterchainProposalExecutorBase {
    constructor(
        address _gateway,
        address _owner
    ) InterchainProposalExecutorBase(_gateway, _owner) {}

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
    ) internal override {
        // You can add your own logic here to handle the payload before the proposal is executed.
    }

    /**
     * @dev A callback function that is called after the proposal is executed.
     * This function emits an event containing the hash of the payload to signify successful execution.
     * @param sourceChain The source chain from where the proposal was sent.
     * @param sourceAddress The source address that sent the proposal. The source address should be the `InterchainProposalSender` contract address at the source chain.
     * @param payload The payload. It is ABI encoded of the caller and calls.
     * Where:
     * - `caller` is the address that calls the `InterchainProposalSender` at the source chain.
     * - `calls` is the array of `InterchainCalls.Call` to execute. Each call contains the target, value, signature and data.
     */
    function onProposalExecuted(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        // You can add your own logic here to handle the payload after the proposal is executed.
        emit ProposalExecuted(keccak256(payload));
    }

    /**
     * @dev A callback function that is called when the execution of a target contract within a proposal fails.
     * This function will revert the transaction providing the failure reason if present in the failure data.
     * @param call The call data that was used to call the target contract.
     * @param result The return data from the failed call to the target contract.
     */
    function onTargetExecutionFailed(
        InterchainCalls.Call memory call,
        bytes memory result
    ) internal pure override {
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
     * @dev A callback function that is called after a target contract within a proposal is successfully executed.
     * This function does not implement any additional logic, but can be customized in derived contracts.
     * @param call The call data that was used to call the target contract.
     * @param result The return data from the successful call to the target contract.
     */
    function onTargetExecuted(
        InterchainCalls.Call memory call,
        bytes memory result
    ) internal override {
        // You can add your own logic here to handle the success of each target contract execution.
    }
}
