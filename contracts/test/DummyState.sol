// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.9;

contract DummyState {
    string public message;

    function setState(string calldata _message) external {
        message = _message;
    }
}
