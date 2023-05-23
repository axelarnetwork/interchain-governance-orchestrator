//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/utils/AddressString.sol";

contract InterchainProposalExecutor is AxelarExecutable, Ownable {
    mapping(string => mapping(address => bool)) public chainWhitelistedCallers;
    mapping(string => mapping(address => bool)) public chainWhitelistedSender;

    constructor(address _gateway) AxelarExecutable(_gateway) {}

    event ProposalExecuted(bytes32 indexed payloadHash);

    modifier onlyWhitelistedCaller(string calldata chain, address caller) {
        require(
            chainWhitelistedCallers[chain][caller],
            "InterchainProposalExecutor: caller is not whitelisted"
        );
        _;
    }

    /**
     * @dev Execute the proposal
     * @param sourceAddress The source address
     * @param payload The payload. The payload is ABI encoded array of interchainProposalCaller, targets, values, signatures and data.
     * Where:
     * - `targets` are the contracts to call
     * - `values` are the amounts of native tokens to send
     * - `signatures` are the function signatures to call
     * - `data` is the encoded function arguments.
     *
     */
    function _execute(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        // Check that the source address is the same as the source interchain sender
        require(
            chainWhitelistedSender[sourceChain][
                StringToAddress.toAddress(sourceAddress)
            ],
            "InterchainProposalExecutor: source address is not whitelisted"
        );

        // Decode the payload
        (address interchainProposalCaller, bytes memory _payload) = abi.decode(
            payload,
            (address, bytes)
        );

        // Execute the proposal
        _executeProposal(sourceChain, interchainProposalCaller, _payload);

        emit ProposalExecuted(keccak256(payload));
    }

    function _executeProposal(
        string calldata chain,
        address proposalCaller,
        bytes memory payload
    ) internal onlyWhitelistedCaller(chain, proposalCaller) {
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
    }

    function setWhitelistedProposalCaller(
        string calldata sourceChain,
        address sourceCaller,
        bool whitelisted
    ) external onlyOwner {
        chainWhitelistedCallers[sourceChain][sourceCaller] = whitelisted;
    }

    function setSourceInterchainSender(
        string calldata sourceChain,
        address sourceInterchainSender,
        bool whitelisted
    ) external onlyOwner {
        chainWhitelistedSender[sourceChain][sourceInterchainSender] = whitelisted;
    }
}
