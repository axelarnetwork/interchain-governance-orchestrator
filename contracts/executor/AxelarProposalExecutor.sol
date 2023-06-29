//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/utils/AddressString.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol";
import "../interfaces/IProposalExecutor.sol";

/**
 * @title AxelarProposalExecutor
 * @dev This contract is intended to be the destination contract for `InterchainProposalSender` contract.
 * The proposal will be finally executed from this contract on the destination chain.
 *
 * The contract maintains whitelists for proposal senders and proposal callers. Proposal senders
 * are InterchainProposalSender contracts at the source chain and proposal callers are contracts
 * that call the InterchainProposalSender at the source chain.
 * For most governance system, the proposal caller should be the Timelock contract.
 *
 * This contract is abstract and some of its functions need to be implemented in a derived contract.
 *
 * Note that due to the inherent dangers of calls with arbitrary data, extra caution should be taken
 * to avoid reentrancy attacks and ensure that the calling contracts are trusted.
 */
abstract contract AxelarProposalExecutor is
    IProposalExecutor,
    AxelarExecutable,
    Ownable,
    ReentrancyGuard
{
    // Whitelisted proposal callers. The proposal caller is the contract that calls the `InterchainProposalSender` at the source chain.
    mapping(string => mapping(address => bool)) public chainWhitelistedCallers;

    // Whitelisted proposal senders. The proposal sender is the `InterchainProposalSender` contract address at the source chain.
    mapping(string => mapping(address => bool)) public chainWhitelistedSender;

    bool public paused;

    constructor(address _gateway, address _owner) AxelarExecutable(_gateway) {
        paused = false;
        _transferOwnership(_owner);
    }

    /**
     * @dev Executes the proposal. The source address must be a whitelisted sender.
     * @param sourceAddress The source address
     * @param payload The payload. It is ABI encoded array of caller, targets, values, signatures and data.
     * Where:
     * - `caller` is the contract that calls the `InterchainProposalSender` at the source chain.
     * - `targets` are the contracts to call
     * - `values` are the amounts of native tokens to send
     * - `signatures` are the function signatures to call
     * - `data` is the encoded function arguments.
     */
    function _execute(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        // Check that the contract is not paused
        if (paused) {
            revert Paused();
        }

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
            address[] memory targets,
            uint256[] memory values,
            string[] memory signatures,
            bytes[] memory data
        ) = abi.decode(
                payload,
                (address, address[], uint256[], string[], bytes[])
            );

        // Check that the caller is whitelisted
        if (!chainWhitelistedCallers[sourceChain][interchainProposalCaller]) {
            revert NotWhitelistedCaller();
        }

        // Execute the proposal with the given arguments
        _executeProposal(targets, values, signatures, data);

        onProposalExecuted(sourceChain, sourceAddress, payload);
    }

    /**
     * @dev Executes the proposal. Calls each target with the respective value, signature, and data.
     * @param targets The contracts to call
     * @param values The amounts of native tokens to send
     * @param signatures The function signatures to call
     * @param data The encoded function arguments
     * @notice This function uses the nonReentrant modifier to prevent reentrancy attack.
     */
    function _executeProposal(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory data
    ) internal nonReentrant {
        // Iterate over all targets and call them with the given data
        for (uint256 i = 0; i < targets.length; i++) {
            // Construct the call data
            bytes memory callData = abi.encodePacked(
                bytes4(keccak256(bytes(signatures[i]))),
                data[i]
            );

            // Call the target
            (bool success, bytes memory result) = targets[i].call{
                value: values[i]
            }(callData);

            if (!success) {
                onTargetExecutionFailed(targets[i], callData, result);
            } else {
                onTargetExecuted(targets[i], callData);
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
     * @dev Pause the contract. Only callable by the contract owner.
     * @param _paused The new paused state.
     */
    function setPaused(bool _paused) external override onlyOwner {
        paused = _paused;
        emit PausedSet(_paused);
    }

    /**
     * @dev Called after a proposal is executed. The derived contract should implement this function.
     * This function should do some post-execution work, such as emitting events.
     * @param sourceChain The source chain
     * @param sourceAddress The source address
     * @param payload The payload that has been executed.
     */
    function onProposalExecuted(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal virtual;

    /**
     * @dev Called when the execution of a target has failed. The derived contract should implement this function.
     * This function should handle the failure. It could revert the transaction, ignore the failure, or do something else.
     * @param target The target contract
     * @param callData The encoded function arguments that was attempted to use.
     * @param result The result of the call.
     */
    function onTargetExecutionFailed(
        address target,
        bytes memory callData,
        bytes memory result
    ) internal virtual;

    /**
     * @dev Called after a target is successfully executed. The derived contract should implement this function.
     * This function should do some post-execution work, such as emitting events.
     * @param target The target contract
     * @param callData The encoded function arguments used.
     */
    function onTargetExecuted(
        address target,
        bytes memory callData
    ) internal virtual;
}
