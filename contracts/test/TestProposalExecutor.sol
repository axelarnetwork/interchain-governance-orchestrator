//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarExecutable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/utils/AddressString.sol";
import "../executor/AxelarProposalExecutor.sol";
import "../lib/InterchainStruct.sol";

/**
 * @title ProposalExecutor
 * @dev This contract provides a simple implementation of the `AxelarProposalExecutor` abstract contract.
 * It offers specific logic for handling proposal execution success and failures as well as emitting events
 * after proposal execution.
 */
contract TestProposalExecutor is AxelarProposalExecutor {
    event BeforeProposalExecuted(
        string sourceChain,
        string sourceAddress,
        bytes payload
    );

    event TargetExecuted(address target, uint256 value, bytes callData);

    constructor(
        address _gateway,
        address _owner
    ) AxelarProposalExecutor(_gateway, _owner) {}

    function beforeProposalExecuted(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        emit BeforeProposalExecuted(sourceChain, sourceAddress, payload);
    }

    function forceExecute(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) external onlyOwner {
        _execute(sourceChain, sourceAddress, payload);
    }

    function onProposalExecuted(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        // You can add your own logic here to handle the payload after the proposal is executed.
        emit ProposalExecuted(keccak256(payload));
    }

    function onTargetExecutionFailed(
        InterchainStruct.Call memory call,
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

    function onTargetExecuted(
        InterchainStruct.Call memory call,
        bytes memory result
    ) internal override {
        emit TargetExecuted(call.target, call.value, call.callData);
    }
}