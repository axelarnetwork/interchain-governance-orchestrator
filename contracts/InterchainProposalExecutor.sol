//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol";

contract InterchainProposalExecutor is AxelarExecutable {
    constructor(address _gateway) AxelarExecutable(_gateway) {}

    event ProposalExecuted(bytes32 indexed payloadHash);

    /**
     * @dev Execute the proposal
     * @param payload The payload. The payload is ABI encoded array of targets, values, signatures and data.
     * Where:
     * - `targets` are the contracts to call
     * - `values` are the amounts of native tokens to send
     * - `signatures` are the function signatures to call
     * - `data` is the encoded function arguments.
     */
    function _execute(
        string calldata,
        string calldata,
        bytes calldata payload
    ) internal override {
        // Decode the payload
        (
            address[] memory targets,
            uint256[] memory values,
            string[] memory signatures,
            bytes[] memory data
        ) = abi.decode(payload, (address[], uint256[], string[], bytes[]));

        // Iterate over all targets and call them with the given data
        for (uint256 i = 0; i < targets.length; i++) {
            // Construct the call data
            bytes memory callData = abi.encodePacked(
                bytes4(keccak256(bytes(signatures[i]))),
                data[i]
            );

            // Call the target
            (bool success, ) = targets[i].call{value: values[i]}(callData);

            // Revert if the call failed
            require(success, "InterchainProposalExecutor: call failed");
        }

        emit ProposalExecuted(keccak256(payload));
    }
}
