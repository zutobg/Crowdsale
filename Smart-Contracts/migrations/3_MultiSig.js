const SolidToken = artifacts.require('SolidToken');
const MultiSigWallet = artifacts.require('MultiSigWallet');
// const Vesting = artifcats.require('SolidVesting');

module.exports = function (deployer, network, accounts) {

  const owner1 = "0xa4C2CD42662C8B7e836fB9CA6D67e7Dc3dD9A4a6";
  const owner2 = "0x096c02a38215e8d869e0a620d07f79A2fCA8A2c9";

  deployer.deploy(MultiSigWallet, [owner1,owner2], 2)
  .then((instance) => {
    console.log("MultiSig address 1: ", instance.address);
    return MultiSigWallet.new([owner1,owner2], 2)
  }).then((instance) => {
    console.log("MultiSig address 2: ", instance.address);
    return MultiSigWallet.new([owner1,owner2], 2)
  }).then((instance) => {
    console.log("MultiSig address 3: ", instance.address);
    return MultiSigWallet.new([owner1,owner2], 2)
  }).then((instance) => {
    console.log("MultiSig address 4: ", instance.address);
  })
}
