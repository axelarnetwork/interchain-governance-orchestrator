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
     * @param destinationChains An array of destination chains
     * @param destinationContracts An array of destination contracts
     * @param fees An array of fees to pay for the interchain transaction
     * @param targets A 2d array of contracts to call. The first dimension is the destination chain index, the second dimension is the destination target contract index.
     * @param values A 2d array of amounts of native tokens to send. The first dimension is the destination chain index, the second dimension is the destination target contract index.
     * @param signatures A 2d array of function signatures to call. The first dimension is the destination chain index, the second dimension is the destination target contract index.
     * @param data A 2d array of encoded function arguments. The first dimension is the destination chain index, the second dimension is the destination target contract index.
     * Note that the destination chain must be unique in the destinationChains array.
     */
    function batchExecuteRemoteProposal(
        string[] memory destinationChains,
        string[] memory destinationContracts,
        uint[] memory fees,
        address[][] memory targets,
        uint256[][] memory values,
        string[][] memory signatures,
        bytes[][] memory data
    ) external payable override {
        // revert if the sum of given fees are not equal to the msg.value
        revertIfInvalidFee(fees);

        // revert if the length of given arrays are not equal
        revertIfInvalidLength(
            destinationChains,
            destinationContracts,
            fees,
            targets,
            values,
            signatures,
            data
        );

        for (uint i = 0; i < destinationChains.length; i++) {
            _executeRemoteProposal(
                destinationChains[i],
                destinationContracts[i],
                fees[i],
                targets[i],
                values[i],
                signatures[i],
                data[i]
            );
        }
    }

    /**
     * @dev Execute an approved proposal at a single destination chain
     * @param destinationChain destination chain
     * @param destinationContract destination contract
     * @param targets An array of contracts to call
     * @param values An array of amounts of native tokens to send
     * @param signatures An array of function signatures
     * @param data An array of encoded function arguments
     */
    function executeRemoteProposal(
        string memory destinationChain,
        string memory destinationContract,
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory data
    ) external payable {
        _executeRemoteProposal(
            destinationChain,
            destinationContract,
            msg.value,
            targets,
            values,
            signatures,
            data
        );
    }

    function _executeRemoteProposal(
        string memory destinationChain,
        string memory destinationContract,
        uint fee,
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory data
    ) internal {
        revertIfInvalidProposalArgs(targets, values, signatures, data);

        if (fee == 0) {
            revert InvalidFee();
        }

        bytes memory payload = abi.encode(
            msg.sender,
            targets,
            values,
            signatures,
            data
        );

        gasService.payNativeGasForContractCall{value: fee}(
            address(this),
            destinationChain,
            destinationContract,
            payload,
            msg.sender
        );

        gateway.callContract(destinationChain, destinationContract, payload);
    }

    function revertIfInvalidProposalArgs(
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
            revert ProposalArgsMisMatched();
        }
    }

    function revertIfInvalidLength(
        string[] memory destinationChains,
        string[] memory destinationContracts,
        uint[] memory fees,
        address[][] memory targets,
        uint256[][] memory values,
        string[][] memory signatures,
        bytes[][] memory data
    ) private pure {
        if (
            destinationChains.length != destinationContracts.length ||
            destinationChains.length != fees.length ||
            destinationChains.length != targets.length ||
            destinationChains.length != values.length ||
            destinationChains.length != signatures.length ||
            destinationChains.length != data.length
        ) {
            revert ArgsLengthMisMatched();
        }
    }

    function revertIfInvalidFee(uint[] memory fees) private {
        uint totalFees = 0;
        for (uint i = 0; i < fees.length; i++) {
            totalFees += fees[i];
        }

        if (totalFees != msg.value) {
            revert InvalidFee();
        }
    }
}
