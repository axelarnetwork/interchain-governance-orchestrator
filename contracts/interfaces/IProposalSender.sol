//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IProposalSender {
    error InvalidArgs();

    function executeRemoteProposal(
        string memory destinationChain,
        string memory destinationContract,
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory data
    ) external payable;
}
