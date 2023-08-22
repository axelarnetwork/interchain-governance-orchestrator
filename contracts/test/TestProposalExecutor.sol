// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@axelar-network/axelar-gmp-sdk-solidity/contracts/utils/Ownable.sol';
import '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarExecutable.sol';
import '@axelar-network/axelar-gmp-sdk-solidity/contracts/libs/AddressString.sol';
import '../InterchainProposalExecutor.sol';
import '../lib/InterchainCalls.sol';

/**
 * @title InterchainProposalExecutor
 * @dev This contract provides a simple implementation of the `InterchainProposalExecutor` abstract contract.
 * It offers specific logic for handling proposal execution success and failures as well as emitting events
 * after proposal execution.
 */
contract TestProposalExecutor is InterchainProposalExecutor {
    event BeforeProposalExecuted(string sourceChain, string sourceAddress, bytes payload);

    event TargetExecuted(address target, uint256 value, bytes callData);

    constructor(address _gateway, address _owner) InterchainProposalExecutor(_gateway, _owner) {}

    function forceExecute(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) external onlyOwner {
        _execute(sourceChain, sourceAddress, payload);
    }
}
