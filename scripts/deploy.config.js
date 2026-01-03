module.exports = {
  AccessPass: {
    contract: "AccessPass",
    args: [],
  },

  Marketplace: {
    contract: "Marketplace",
    // args có thể là function để lấy address contract đã deploy trước đó
    args: (deployed) => [deployed.AccessPass],
  },
};