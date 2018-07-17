const SolidToken = artifacts.require('./SolidToken.sol');
const TokenSale = artifacts.require('./TokenSale.sol');
const MultiSigWallet = artifacts.require('MultiSigWallet');
// const Vesting = artifcats.require('SolidVesting');

module.exports = function (deployer, network, accounts) {

  const rate = 15;

  console.log(SolidToken.address);
  console.log(MultiSigWallet.address);

  deployer.deploy(TokenSale,rate,MultiSigWallet.address,SolidToken.address)
  .then((instance) => {
    console.log("Deploying Token Sale");
    console.log("Token Sale address: ", instance.address);
  })
}
