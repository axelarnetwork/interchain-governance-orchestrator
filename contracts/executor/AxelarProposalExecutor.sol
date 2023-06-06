//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/utils/AddressString.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../interfaces/IProposalExecutor.sol";

contract AxelarProposalExecutor is
    Ownable,
    AxelarExecutable,
    IProposalExecutor
{
    mapping(string => mapping(address => bool)) public chainWhitelistedCallers;
    mapping(string => mapping(address => bool)) public chainWhitelistedSender;

    constructor(address _gateway) AxelarExecutable(_gateway) {}

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

        // Execute the proposal
        _executeProposal(targets, values, signatures, data);

        emit ProposalExecuted(keccak256(payload));
    }

    function _executeProposal(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory data
    ) internal virtual {}

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

    function setWhitelistedProposalSender(
        string calldata sourceChain,
        address sourceInterchainSender,
        bool whitelisted
    ) external override onlyOwner {
        chainWhitelistedSender[sourceChain][
            sourceInterchainSender
        ] = whitelisted;
        emit WhitelistedProposalSenderSet(
            sourceChain,
            sourceInterchainSender,
            whitelisted
        );
    }
}
