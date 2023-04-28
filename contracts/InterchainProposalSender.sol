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

    function interchainPropose(
        string memory destinationChain,
        string memory destinationContract,
        bytes memory payload
    ) public payable onlyOwner {
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
