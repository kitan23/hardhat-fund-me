import { getNamedAccounts, ethers } from "hardhat";

async function main() {
	const accounts = await ethers.getSigners();
	const deployer = accounts[0];
	const fundMe = await ethers.getContract("FundMe", deployer.address);
	const sendValue = ethers.utils.parseEther("0.05");

	console.log("Funding contract...");
	const transactionResponse = await fundMe.fund({ value: sendValue });
	await transactionResponse.wait(1);
	console.log("Contract Funded");
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.log(error);
		process.exit(1);
	});
