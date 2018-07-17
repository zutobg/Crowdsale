const SolidToken = artifacts.require('SolidToken');
const MultiSigWallet = artifacts.require('MultiSigWallet');
// const Vesting = artifcats.require('SolidVesting');

module.exports = function (deployer, network, accounts) {

  const owner1 = accounts[5];
  const owner2 = accounts[6];
  const owner3 = accounts[7];

  deployer.deploy(MultiSigWallet, [owner1,owner2,owner3], 2)
  .then((instance) => {
    console.log("Deploying Multisig Wallet");
    console.log("MultiSig address: ", instance.address);
  })
}
