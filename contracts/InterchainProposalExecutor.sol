//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/utils/AddressString.sol";

contract InterchainProposalExecutor is AxelarExecutable, Ownable {
    address public sourceInterchainSender;
    mapping(address => bool) public whitelistedProposalCallers;

    constructor(
        address _gateway,
        address _sourceInterchainSender
    ) AxelarExecutable(_gateway) {
        sourceInterchainSender = _sourceInterchainSender;
    }

    event ProposalExecuted(bytes32 indexed payloadHash);

    modifier onlyWhitelistedCaller(address caller) {
        require(
            whitelistedProposalCallers[caller],
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
        string calldata,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        // Check that the source address is the same as the source interchain sender
        require(
            StringToAddress.toAddress(sourceAddress) == sourceInterchainSender,
            "InterchainProposalExecutor: source address is not the same as the source interchain sender"
        );

        // Decode the payload
        (address interchainProposalCaller, bytes memory _payload) = abi.decode(
            payload,
            (address, bytes)
        );

        // Execute the proposal
        _executeProposal(interchainProposalCaller, _payload);

        emit ProposalExecuted(keccak256(payload));
    }

    function _executeProposal(
        address proposalCaller,
        bytes memory payload
    ) internal onlyWhitelistedCaller(proposalCaller) {
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
        address caller,
        bool whitelisted
    ) external onlyOwner {
        whitelistedProposalCallers[caller] = whitelisted;
    }

    function setSourceInterchainSender(
        address _sourceInterchainSender
    ) external onlyOwner {
        sourceInterchainSender = _sourceInterchainSender;
    }
}
