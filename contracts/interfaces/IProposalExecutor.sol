//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IProposalExecutor {
    event WhitelistedProposalCallerSet(
        string indexed sourceChain,
        address indexed sourceCaller,
        bool whitelisted
    );
    event WhitelistedProposalSenderSet(
        string indexed sourceChain,
        address indexed sourceInterchainSender,
        bool whitelisted
    );
    event ProposalExecuted(bytes32 indexed payloadHash);

    error ProposalExecuteFailed();
    error NotWhitelistedCaller();
    error NotWhitelistedSourceAddress();

    function setWhitelistedProposalSender(
        string calldata sourceChain,
        address sourceInterchainSender,
        bool whitelisted
    ) external;

    function setWhitelistedProposalCaller(
        string calldata sourceChain,
        address sourceCaller,
        bool whitelisted
    ) external;
}
