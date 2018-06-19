const SolidToken = artifacts.require('./SolidToken.sol');
const TokenSale = artifacts.require('./TokenSale.sol');


module.exports = function (deployer, network, accounts) {

  const rate = 15;
  const wallet = accounts[9];
  const multisig = accounts[8];
  const presaleCap = 19200 * 10^18;
  const mainSaleCap = 12000 * 10^18;
  let token;
  let tokenSale;


  deployer.deploy(SolidToken)
  .then((instance) => {
    console.log(instance.address);
    token = instance;
    return deployer.deploy(TokenSale,rate,wallet, instance.address);
  })
  .then(instance => {
    tokenSale = instance;
    return token.transferOwnership(instance.address);
  })
  .then(() => {
    return tokenSale.setupSale(1529949600, token.address);
  })
  .then(() => {
    return tokenSale.transferOwnership(accounts[1]);
  })
}
