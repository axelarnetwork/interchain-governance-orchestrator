//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarExecutable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/utils/AddressString.sol";
import "./executor/AxelarProposalExecutor.sol";

contract ProposalExecutor is AxelarProposalExecutor {
    constructor(address _gateway) AxelarProposalExecutor(_gateway) {}

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
     * @dev A callback function that is called after the proposal is executed
     * @param sourceChain The source chain
     * @param sourceAddress The source address
     * @param payload The payload. The payload is ABI encoded array of proposalCaller, targets, values, signatures and data.
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
        // You can add your own logic here to handle the payload after the proposal is executed
        emit ProposalExecuted(keccak256(payload));
    }
}
