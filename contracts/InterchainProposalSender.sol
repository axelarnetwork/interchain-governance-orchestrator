//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";
// import Initializable contract
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract InterchainProposalSender is Initializable {
    IAxelarGateway public gateway;
    IAxelarGasService public gasService;
    bool public initialized;

    function initialize(
        address _gateway,
        address _gasService
    ) external initializer {
        gateway = IAxelarGateway(_gateway);
        gasService = IAxelarGasService(_gasService);
        initialized = true;
    }

    /**
     * @dev Execute an approved proposal in an interchain transaction
     * @param destinationChain The destination chain
     * @param destinationContract The destination contract
     * @param payload The payload. The payload is ABI encoded array of targets, values, signatures and data.
     */
    function executeRemoteProposal(
        string memory destinationChain,
        string memory destinationContract,
        bytes memory payload
    ) external payable {
        // check if payload is valid
        (
            address[] memory targets,
            uint256[] memory values,
            string[] memory signatures,
            bytes[] memory data
        ) = abi.decode(payload, (address[], uint256[], string[], bytes[]));

        require(targets.length > 0, "InterchainProposalSender: no targets");
        require(
            targets.length == values.length &&
                targets.length == signatures.length &&
                targets.length == data.length,
            "InterchainProposalSender: invalid payload"
        );

        bytes memory encodedSenderPayload = abi.encode(msg.sender, payload);

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
}
