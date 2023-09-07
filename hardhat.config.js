require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-deploy");
require("@nomiclabs/hardhat-ethers");

const GOERLI_RPC_URL =
  process.env.GOERLI_RPC_URL || "https:://eth-goerli/example";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xKey";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "0xKey";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "0xKey";

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    // npx hardhat run scripts/deploy.js --network goerli
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 5,
      blockConfirmations: 6,
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      //Accounts: Hardhat Automatic
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    // Enable = On/Off Switch
    enabled: true,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    coinmarketcap: COINMARKETCAP_API_KEY,
    // token: "matic",
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    users: {
      default: 1,
    },
  },
  solidity: {
    compilers: [{ version: "0.8.19" }, { version: "0.6.6" }],
  },
};
