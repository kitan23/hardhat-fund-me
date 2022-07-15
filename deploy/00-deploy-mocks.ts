import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
	developmentChains,
	DECIMALS,
	INITIAL_ANSWER,
} from "../helper-hardhat-config";

module.exports = async function (hre: HardhatRuntimeEnvironment) {
	// @ts-ignore
	const { getNamedAccounts, deployments, network } = hre;
	const { deploy, log } = deployments;
	const { deployer } = await getNamedAccounts();

	if (developmentChains.includes(network.name)) {
		log("Local network detected! Deploying mock contracts...");
		await deploy("MockV3Aggregator", {
			contract: "MockV3Aggregator",
			from: deployer,
			log: true,
			args: [DECIMALS, INITIAL_ANSWER],
		});
		log("Mocks deployed");
		log("__________________________");
	}
};

module.exports.tags = ["all", "mocks"];
