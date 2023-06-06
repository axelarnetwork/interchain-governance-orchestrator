//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";
import "./interfaces/IProposalSender.sol";

contract InterchainProposalSender is IProposalSender {
    IAxelarGateway public gateway;
    IAxelarGasService public gasService;

    constructor(address _gateway, address _gasService) {
        gateway = IAxelarGateway(_gateway);
        gasService = IAxelarGasService(_gasService);
    }

    /**
     * @dev Execute an approved proposal in an interchain transaction
     * @param destinationChain The destination chain
     * @param destinationContract The destination contract
     * @param targets The contracts to call
     * @param values The amounts of native tokens to send
     * @param signatures The function signatures to call
     * @param data The encoded function arguments.
     */
    function executeRemoteProposal(
        string memory destinationChain,
        string memory destinationContract,
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory data
    ) external payable override {
        revertIfInvalidArgs(targets, values, signatures, data);

        bytes memory encodedSenderPayload = abi.encode(
            msg.sender,
            targets,
            values,
            signatures,
            data
        );

        if (msg.value > 0) {
            gasService.payNativeGasForContractCall{value: msg.value}(
                address(this),
                destinationChain,
                destinationContract,
                encodedSenderPayload,
                msg.sender
            );
        }
        gateway.callContract(
            destinationChain,
            destinationContract,
            encodedSenderPayload
        );
    }

    function revertIfInvalidArgs(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory data
    ) private pure {
        if (
            targets.length == 0 ||
            targets.length != values.length ||
            targets.length != signatures.length ||
            targets.length != data.length
        ) {
            revert InvalidArgs();
        }
    }
}
