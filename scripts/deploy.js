const { ethers } = require("hardhat");
const deployConfig = require("./deploy.config");
const fs = require("fs");
const path = require("path");

async function main() {
  const deployed = {};

  for (const key of Object.keys(deployConfig)) {
    const { contract, args } = deployConfig[key];

    console.log(`\nDeploying ${contract}...`);

    const Factory = await ethers.getContractFactory(contract);

    const resolvedArgs =
      typeof args === "function" ? args(deployed) : args;

    const instance = await Factory.deploy(...resolvedArgs);
    await instance.waitForDeployment();

    const address = await instance.getAddress();
    deployed[key] = address;

    console.log(`${contract} deployed at: ${address}`);
  }

  // Post-deploy wiring
  if (deployed.AccessPass && deployed.Marketplace) {
    const accessPass = await ethers.getContractAt(
      "AccessPass",
      deployed.AccessPass
    );
    const tx = await accessPass.setMarketplace(deployed.Marketplace);
    await tx.wait();
    console.log("Marketplace set in AccessPass");
  }

  const addresses = {
    localhost: {
      Marketplace: deployed.Marketplace,
      AccessPass: deployed.AccessPass,
    },
  };

  const outputPath = path.join(__dirname, "..", "addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));

  console.log("Addresses saved to addresses.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
