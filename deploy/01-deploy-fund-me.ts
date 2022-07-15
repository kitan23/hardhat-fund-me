import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { developmentChains, networkConfig } from "../helper-hardhat-config";
import { verify } from "../utils/verify";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
	//@ts-ignore
	const { getNamedAccounts, deployments, network } = hre;
	const { deploy, log } = deployments;
	const { deployer } = await getNamedAccounts();
	const chainId = network.config.chainId;

	let ethUsdPriceFeedAddress;

	if (developmentChains.includes(network.name)) {
		const ethUsdAggregator = await deployments.get("MockV3Aggregator");
		ethUsdPriceFeedAddress = ethUsdAggregator.address;
	} else {
		ethUsdPriceFeedAddress = networkConfig[network.name].ethUsdPriceFeed;
	}

	const fundMe = await deploy("FundMe", {
		from: deployer,
		args: [ethUsdPriceFeedAddress],
		log: true,
		// @ts-ignore
		waitConfirmation: network.config.blockConfirmations || 1,
	});
	if (
		!developmentChains.includes(network.name) &&
		process.env.ETHERSCAN_API_KEY
	) {
		await verify(fundMe.address, [ethUsdPriceFeedAddress!]);
	}
	log("____________________");
};

export default func;
func.tags = ["all"];
