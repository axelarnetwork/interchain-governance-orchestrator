//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// import ownable from openzeppelin
import "@openzeppelin/contracts/access/Ownable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol";

contract InterchainProposalSender is Ownable {
    IAxelarGateway public gateway;
    IAxelarGasService public gasService;

    constructor(address _gateway, address _gasService) {
        gateway = IAxelarGateway(_gateway);
        gasService = IAxelarGasService(_gasService);
    }

    /**
     * @dev Propose an interchain transaction
     * @param destinationChain The destination chain
     * @param destinationContract The destination contract
     * @param payload The payload. The payload is ABI encoded array of targets, values, signatures and data.
     */
    function interchainPropose(
        string memory destinationChain,
        string memory destinationContract,
        bytes memory payload
    ) public payable onlyOwner {
        // check if payload is valid
        (
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory signatures,
            bytes[] memory data
        ) = abi.decode(payload, (address[], uint256[], bytes[], bytes[]));

        require(targets.length > 0, "InterchainProposalSender: no targets");
        require(
            targets.length == values.length &&
                targets.length == signatures.length &&
                targets.length == data.length,
            "InterchainProposalSender: invalid payload"
        );

        if (msg.value > 0) {
            gasService.payNativeGasForContractCall{value: msg.value}(
                address(this),
                destinationChain,
                destinationContract,
                payload,
                msg.sender
            );
        }
        gateway.callContract(destinationChain, destinationContract, payload);
    }
}
