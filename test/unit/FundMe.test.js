const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function () {
      let fundMe;
      let deployer;
      let mockV3Aggregator;
      const sendValue = "1000000000000000000"; // 1 ETH

      beforeEach(async function () {
        // deploy our FundMe contract
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        fundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("constructor", async function () {
        it("sets the aggregator address correctly", async function () {
          const response = await fundMe.getPriceFeed();
          assert.equal(response, await mockV3Aggregator.getAddress());
        });
      });

      describe("fund", async function () {
        it("Fails if you don't send enough ETH", async function () {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });

        it("updated the amount funded data structure", async function () {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });

        it("Adds funder to array of s_funders", async function () {
          await fundMe.fund({ value: sendValue });
          const funder = await fundMe.getFunder(0);
          assert.equal(funder, deployer);
        });
      });

      describe("withdraw", async function () {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue });
        });
        it("withdraw ETH from a single funder", async function () {
          // Arrange
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.getAddress()
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );
          // Act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, gasPrice } = transactionReceipt;
          const gasCost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.getAddress()
          );
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );
          // Assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          );
          // console.log("Gas cost: ", gasCost.toString());
        });

        it("allows us to withdraw with multiple s_funders", async function () {
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.getAddress()
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );
          // Act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, gasPrice } = transactionReceipt;
          const gasCost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.getAddress()
          );
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );
          // Assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          );
          //Reset s_funders
          await expect(fundMe.getFunder(0)).to.be.reverted;
          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].getAddress()),
              0
            );
          }
        });

        it("only allows the owner to withdraw", async function () {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const attackerConnectedContract = await fundMe.connect(attacker);
          await expect(
            attackerConnectedContract.withdraw()
          ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
        });

        it("cheaperWithdraw testing...", async function () {
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.getAddress()
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );
          // Act
          const transactionResponse = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, gasPrice } = transactionReceipt;
          const gasCost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.getAddress()
          );
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );
          // Assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            (startingFundMeBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          );
          //Reset s_funders
          await expect(fundMe.getFunder(0)).to.be.reverted;
          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].getAddress()),
              0
            );
          }
        });
      });
    });
