import { Contract, ethers } from 'ethers';
import { sleep } from './sleep';

export async function transferTimelockAdmin(
  timelock: Contract,
  newAdmin: string,
) {
  const block = await timelock.provider.getBlock('latest');
  const delay = block.timestamp + 2;
  await timelock.queueTransaction(
    timelock.address,
    0,
    'setPendingAdmin(address)',
    ethers.utils.defaultAbiCoder.encode(['address'], [newAdmin]),
    delay,
  );
  await sleep(3000);
  await timelock.executeTransaction(
    timelock.address,
    0,
    'setPendingAdmin(address)',
    ethers.utils.defaultAbiCoder.encode(['address'], [newAdmin]),
    delay,
  );
}
