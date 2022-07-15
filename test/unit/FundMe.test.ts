import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { FundMe, MockV3Aggregator } from "../../typechain";
import { developmentChains } from "../../helper-hardhat-config";

!developmentChains.includes(network.name)
	? describe.skip
	: describe("FundMe", function () {
			let deployer: SignerWithAddress;
			let fundMe: FundMe;
			let mockV3Aggregator: MockV3Aggregator;
			const sendValue = ethers.utils.parseEther("1");
			beforeEach(async function () {
				// deployer = (await getNamedAccounts()).deployer;
				// await deployments.fixture(["all"]);
				if (!developmentChains.includes(network.name)) {
					throw "You need to be on a development chain to run tests";
				}

				const accounts = await ethers.getSigners();
				deployer = accounts[0];
				await deployments.fixture(["all"]);
				fundMe = await ethers.getContract("FundMe");
				mockV3Aggregator = await ethers.getContract("MockV3Aggregator");
			});
			describe("constructor", async function () {
				it("sets the aggregator address correctly", async function () {
					const response = await fundMe.getPriceFeed();
					assert.equal(response, mockV3Aggregator.address);
				});
			});

			describe("fund", function () {
				it("Fails if you dont send enough ETH", async function () {
					await expect(fundMe.fund()).to.be.revertedWith(
						"FundMe__NotEnoughFunds"
					);
				});
				it("Update the amount funded", async function () {
					await fundMe.fund({ value: sendValue });
					const response = await fundMe.getAddressToAmountFunded(
						deployer.address
					);
					assert.equal(response.toString(), sendValue.toString());
				});
				it("Add funder to array of s_funders", async function () {
					await fundMe.fund({ value: sendValue });
					const response = await fundMe.getFunders(0);
					assert.equal(response, deployer.address);
				});
			});

			describe("withdraw", async function () {
				beforeEach(async function () {
					await fundMe.fund({ value: sendValue });
				});
				it("Withdraw ETH from a single founder", async function () {
					const startingFundMeBalance = await fundMe.provider.getBalance(
						fundMe.address
					);
					const startingDeployerBalance = await fundMe.provider.getBalance(
						deployer.address
					);
					const transactionResponse = await fundMe.withdraw();
					const transactionReceipt = await transactionResponse.wait(1);
					const { gasUsed, effectiveGasPrice } = transactionReceipt;
					const gasCost = gasUsed.mul(effectiveGasPrice);
					const endingFundMeBalance = await fundMe.provider.getBalance(
						fundMe.address
					);
					const endingDeployerBalance = await fundMe.provider.getBalance(
						deployer.address
					);
					assert.equal(endingFundMeBalance.toString(), "0");
					assert.equal(
						startingFundMeBalance.add(startingDeployerBalance).toString(),
						endingDeployerBalance.add(gasCost).toString()
					);
				});

				//
				it("ALlows us to withdraw with multiple s_funders", async function () {
					const accounts = await ethers.getSigners();
					for (let i = 1; i < 6; i++) {
						const fundMeConntectedContract = await fundMe.connect(
							accounts[i]
						);
						await fundMeConntectedContract.fund({ value: sendValue });
					}
					const startingFundMeBalance = await fundMe.provider.getBalance(
						fundMe.address
					);
					const startingDeployerBalance = await fundMe.provider.getBalance(
						deployer.address
					);

					const transactionResponse = await fundMe.withdraw();
					const transactionReceipt = await transactionResponse.wait(1);
					const { gasUsed, effectiveGasPrice } = transactionReceipt;
					const gasCost = gasUsed.mul(effectiveGasPrice);

					const endingFundMeBalance = await fundMe.provider.getBalance(
						fundMe.address
					);
					const endingDeployerBalance = await fundMe.provider.getBalance(
						deployer.address
					);
					assert.equal(endingFundMeBalance.toString(), "0");
					assert.equal(
						startingFundMeBalance.add(startingDeployerBalance).toString(),
						endingDeployerBalance.add(gasCost).toString()
					);

					await expect(fundMe.getFunders(0)).to.be.reverted;
					for (let i = 1; i < 6; i++) {
						assert.equal(
							await (
								await fundMe.getAddressToAmountFunded(
									accounts[i].address
								)
							).toString(),
							"0"
						);
					}
				});

				it("Cheaper withdraw with multiple funders", async function () {
					const accounts = await ethers.getSigners();
					for (let i = 1; i < 6; i++) {
						const fundMeConntectedContract = await fundMe.connect(
							accounts[i]
						);
						await fundMeConntectedContract.fund({ value: sendValue });
					}
					const startingFundMeBalance = await fundMe.provider.getBalance(
						fundMe.address
					);
					const startingDeployerBalance = await fundMe.provider.getBalance(
						deployer.address
					);

					const transactionResponse = await fundMe.cheaperWithdraw();
					const transactionReceipt = await transactionResponse.wait(1);
					const { gasUsed, effectiveGasPrice } = transactionReceipt;
					const gasCost = gasUsed.mul(effectiveGasPrice);

					const endingFundMeBalance = await fundMe.provider.getBalance(
						fundMe.address
					);
					const endingDeployerBalance = await fundMe.provider.getBalance(
						deployer.address
					);
					assert.equal(endingFundMeBalance.toString(), "0");
					assert.equal(
						startingFundMeBalance.add(startingDeployerBalance).toString(),
						endingDeployerBalance.add(gasCost).toString()
					);

					await expect(fundMe.getFunders(0)).to.be.reverted;
					for (let i = 1; i < 6; i++) {
						assert.equal(
							await (
								await fundMe.getAddressToAmountFunded(
									accounts[i].address
								)
							).toString(),
							"0"
						);
					}
				});

				it("Only allows i_owner to withdraw", async function () {
					const accounts = await ethers.getSigners();
					const attacker = accounts[1];
					const attackerConntectedContract = await fundMe.connect(
						attacker
					);
					await expect(
						attackerConntectedContract.withdraw()
					).to.be.revertedWith("FundMe__NotOwner");
				});
			});
	  });
