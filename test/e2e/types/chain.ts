export interface Chain {
  name: string;
  chainId: number;
  gateway: string;
  gasService: string;
  constAddressDeployer: string;
  create3Deployer: string;
  rpc: string;
  tokens: string;
  GMPExpressService: {
    expressOperator: string;
    salt: 'GMPExpressService';
    address: string;
    implementation: string;
    deployer: string;
    proxyDeployer: string;
  };
}
