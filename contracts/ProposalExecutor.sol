//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarExecutable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/utils/AddressString.sol";
import "./executor/AxelarProposalExecutor.sol";

/**
 * @title ProposalExecutor
 * @dev This contract provides a simple implementation of the `AxelarProposalExecutor` abstract contract.
 * It offers specific logic for handling proposal execution success and failures as well as emitting events
 * after proposal execution.
 */
contract ProposalExecutor is AxelarProposalExecutor {
    constructor(address _gateway) AxelarProposalExecutor(_gateway) {}

    /**
     * @dev A callback function that is called after the proposal is executed.
     * This function emits an event containing the hash of the payload to signify successful execution.
     * @param sourceChain The source chain from where the proposal was sent.
     * @param sourceAddress The source address that sent the proposal. The source address should be the `InterchainProposalSender` contract address at the source chain.
     * @param payload The payload of the proposal.
     * The payload is ABI encoded array of proposalCaller, targets, values, signatures and data.
     * Where:
     * - `proposalCaller` is the contract that calls the `InterchainProposalSender` at the source chain.
     * - `targets` are the contracts to call
     * - `values` are the amounts of native tokens to send
     * - `signatures` are the function signatures to call
     * - `data` is the encoded function arguments.
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
     * @param target The target contract that failed to execute.
     * @param callData The data that was used to call the target contract.
     * @param result The return data from the failed call to the target contract.
     */
    function onTargetExecutionFailed(
        address target,
        bytes memory callData,
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
     * @param target The target contract that was successfully executed.
     * @param callData The data that was used to call the target contract.
     */
    function onTargetExecuted(
        address target,
        bytes memory callData
    ) internal override {
        // You can add your own logic here to handle the success of each target contract execution.
    }
}
