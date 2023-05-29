//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarExecutable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/utils/AddressString.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./executor/AxelarProposalExecutor.sol";

contract ProposalExecutor is AxelarProposalExecutor, ReentrancyGuard {
    function _executeProposal(
        bytes memory payload
    ) internal override nonReentrant {
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
            (bool success, bytes memory result) = targets[i].call{
                value: values[i]
            }(callData);

            if (!success) {
                // Propagate the failure information.
                if (result.length > 0) {
                    // The failure data is a revert reason string.
                    assembly {
                        let resultSize := mload(result)
                        revert(add(32, result), resultSize)
                    }
                } else {
                    // There is no failure data, just revert with no reason.
                    revert("ProposalExecutor: call failed");
                }
            }
        }
    }
}
