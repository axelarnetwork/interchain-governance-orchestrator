//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarExecutable.sol";
import "@axelar-network/axelar-gmp-sdk-solidity/contracts/utils/AddressString.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract AxelarProposalExecutor is Ownable, IAxelarExecutable, Initializable {
    IAxelarGateway private _gateway;
    bool private _initialized;
    mapping(string => mapping(address => bool)) public chainWhitelistedCallers;
    mapping(string => mapping(address => bool)) public chainWhitelistedSender;

    function initialize(address gatewayAddress) public initializer {
        _gateway = IAxelarGateway(gatewayAddress);
        _initialized = true;
    }

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

    modifier onlyWhitelistedCaller(string calldata chain, address caller) {
        require(
            chainWhitelistedCallers[chain][caller],
            "ProposalExecutor: caller is not whitelisted"
        );
        _;
    }

    function gateway() public view returns (IAxelarGateway) {
        return _gateway;
    }

    function initialized() public view returns (bool) {
        return _initialized;
    }

    function execute(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) external {
        bytes32 payloadHash = keccak256(payload);

        if (
            !_gateway.validateContractCall(
                commandId,
                sourceChain,
                sourceAddress,
                payloadHash
            )
        ) revert NotApprovedByGateway();

        _execute(sourceChain, sourceAddress, payload);
    }

    /**
     * @dev Execute the proposal
     * @param sourceAddress The source address
     * @param payload The payload. The payload is ABI encoded array of interchainProposalCaller, targets, values, signatures and data.
     * Where:
     * - `targets` are the contracts to call
     * - `values` are the amounts of native tokens to send
     * - `signatures` are the function signatures to call
     * - `data` is the encoded function arguments.
     *
     */
    function _execute(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal {
        // Check that the source address is whitelisted
        require(
            chainWhitelistedSender[sourceChain][
                StringToAddress.toAddress(sourceAddress)
            ],
            "ProposalExecutor: source address is not whitelisted"
        );

        // Decode the payload
        (address interchainProposalCaller, bytes memory _payload) = abi.decode(
            payload,
            (address, bytes)
        );

        // Check that the caller is whitelisted
        require(
            chainWhitelistedCallers[sourceChain][interchainProposalCaller],
            "ProposalExecutor: caller is not whitelisted"
        );

        // Execute the proposal
        _executeProposal(_payload);

        emit ProposalExecuted(keccak256(payload));
    }

    function _executeProposal(bytes memory payload) internal virtual {}

    function setWhitelistedProposalCaller(
        string calldata sourceChain,
        address sourceCaller,
        bool whitelisted
    ) external onlyOwner {
        chainWhitelistedCallers[sourceChain][sourceCaller] = whitelisted;
        emit WhitelistedProposalCallerSet(
            sourceChain,
            sourceCaller,
            whitelisted
        );
    }

    function setWhitelistedProposalSender(
        string calldata sourceChain,
        address sourceInterchainSender,
        bool whitelisted
    ) external onlyOwner {
        chainWhitelistedSender[sourceChain][
            sourceInterchainSender
        ] = whitelisted;
        emit WhitelistedProposalSenderSet(
            sourceChain,
            sourceInterchainSender,
            whitelisted
        );
    }

    function executeWithToken(
        bytes32,
        string calldata,
        string calldata,
        bytes calldata,
        string calldata,
        uint256
    ) external pure override {
        revert("not implemented");
    }
}
