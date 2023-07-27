import { DeployFunction } from 'hardhat-deploy/dist/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { contracts } from '../constants';

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const [deployer] = await hre.getUnnamedAccounts();
  const { deterministic } = hre.deployments;

  const { deploy } = await deterministic('Create3Deployer', {
    from: deployer,
  });

  const result = await deploy();
  console.log('Deploy Deployer:', result.address);
};

deploy.tags = ['Deployer'];
deploy.skip = (env: HardhatRuntimeEnvironment) => {
  const chain = contracts[env.network.name];
  if (chain.create3Deployer) return Promise.resolve(true);

  return env.deployments.getOrNull('Create3Deployer').then((d) => !!d);
};

export default deploy;
