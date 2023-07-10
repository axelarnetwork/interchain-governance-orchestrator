import { task } from "hardhat/config";
import {
  DummyState,
} from "../typechain-types";

task(
  "readDummyState",
  "Read message from DummyState contract"
)
  .setAction(async (_, hre) => {
    const contract = await hre.ethers.getContract<DummyState>("DummyState")
    console.log("DummyState message:", await contract.message())
  });
