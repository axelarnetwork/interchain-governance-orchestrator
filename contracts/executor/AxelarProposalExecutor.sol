//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/utils/AddressString.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol";
import "../interfaces/IProposalExecutor.sol";

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

    constructor(address _gateway) AxelarExecutable(_gateway) {}

    /**
     * @dev Execute the proposal
     * @param sourceAddress The source address
     * @param payload The payload. The payload is ABI encoded array of proposalCaller, targets, values, signatures and data.
     * Where:
     * - `proposalCaller` is the contract that calls the `InterchainProposalSender` at the source chain.
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
                // Propagate the failure information.
                if (result.length > 0) {
                    // The failure data is a revert reason string.
                    assembly {
                        let resultSize := mload(result)
                        revert(add(32, result), resultSize)
                    }
                } else {
                    // There is no failure data, just revert with no reason.
                    revert ProposalExecuteFailed();
                }
            }
        }
    }

    function onProposalExecuted(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal virtual;

    function setWhitelistedProposalSender(
        string calldata sourceChain,
        address sourceSender,
        bool whitelisted
    ) external virtual {}

    function setWhitelistedProposalCaller(
        string calldata sourceChain,
        address sourceCaller,
        bool whitelisted
    ) external virtual {}
}
