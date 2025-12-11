require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // Gọi thư viện đọc file .env

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20", // Đảm bảo phiên bản này khớp với file .sol của bạn (dòng đầu tiên trong file contract)
  networks: {
    // Mạng Localhost
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    // Mạng Polygon Amoy
    amoy: {
      url: process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology/",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80002
    },
  },
  // Phần này để xác thực code trên PolygonScan (Làm sau cũng được)
  etherscan: {
    apiKey: {
      polygonAmoy: "KEY_TU_POLYGONSCAN" // Tạm thời để trống hoặc điền sau
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com"
        }
      }
    ]
  }
};
