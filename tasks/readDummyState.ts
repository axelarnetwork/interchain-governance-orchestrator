import { task } from "hardhat/config";
import { getDeploymentAddress } from "./helpers/deployment";

task(
  "readDummyState",
  "Read message from DummyState contract"
)
  .setAction(async (_, hre) => {
    const address = getDeploymentAddress(hre, "DummyState", hre.network.name);
    const contract = await hre.ethers.getContractAt("DummyState", address)
    console.log("DummyState message:", await contract.message())
  });
