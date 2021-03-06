const SolidToken = artifacts.require('SolidToken.sol');
const TokenSale = artifacts.require('TokenSale.sol');
//const MultiSigWallet = artifacts.require('MultiSigWallet');
// const Vesting = artifcats.require('SolidVesting');

module.exports = function (deployer, network, accounts) {

  const rate = 15;
  const saleStart = 1532293200;
  const saleManager = "0x766C0D25Ac2784C1A811c6d767E88c29Ee5aD615";
  const wallet = "0x0acc23af96f4c43cf61e639cfc5c0937b9e07e7c";
  let sale = {};

  deployer.deploy(TokenSale,rate,wallet,SolidToken.address)
  .then((instance) => {
    console.log("Token Sale address: ", instance.address);
    sale = instance;
    return SolidToken.deployed()
  })
  .then((token) => {
    return token.transferOwnership(TokenSale.address);
  })
  .then(() => {
    return sale.setupSale(saleStart, SolidToken.address);
  })
  .then(() => {
    return sale.transferOwnership(saleManager);
  })
}
