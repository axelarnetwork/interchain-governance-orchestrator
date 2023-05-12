pragma solidity ^0.8.9;

contract DummyProposalExecutor {
    function propose(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory data
    ) external payable {
        for (uint256 i = 0; i < targets.length; i++) {
            bytes memory callData;

            if (bytes(signatures[i]).length == 0) {
                callData = data[i];
            } else {
                callData = abi.encodePacked(
                    bytes4(keccak256(bytes(signatures[i]))),
                    data[i]
                );
            }

            (bool success, ) = targets[i].call{value: values[i]}(callData);

            require(success, "Transaction execution reverted.");
        }
    }
}
