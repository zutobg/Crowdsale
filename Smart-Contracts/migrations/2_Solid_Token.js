const SolidToken = artifacts.require('./SolidToken.sol');

module.exports = function (deployer, network, accounts) {
  
  deployer.deploy(SolidToken)
  .then((instance) => {
    console.log("Deploying Solid token");
    console.log("Solid token address: ", instance.address);
  })
}
