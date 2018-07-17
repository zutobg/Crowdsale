const SolidVesting = artifacts.require('SolidVesting');
const SafeERC20 = artifacts.require('SafeERC20');

module.exports = function (deployer, network, accounts) {

  const start = 1540252800;
  const cliff = 31536000;
  const duration = 94608000;
  const newOwner = accounts[9]; // PLACHEOLDER for MULISIG ADDRESS

  [
    "0x3be72904acb1f83b3f25536d2391ecc567b7c3e6", // Alex
    "0x6eB4e59aB22ac614cf800D3CB6d086C19900e606", // Adam
    "0x00000000000000000000000000000000000000ED", // ED - PLACHEOLDER
    "0x125b8e6f1d7e85eac84f2c0dbff46965b89bb1e7", //JG
    "0xB7CB5D597f498663CA33787eaeda4433B6EBD286", //Nick
    "0xaa0b244f8740d891f9b2d341eb27a49ca04a4dec", //Rob Hitchens
    "0x6C2975e008F00B05EcF132fF1e7B8E6333E17F83", // Rob Stone
  ].forEach(address => {
    return SolidVesting.new(address, start, cliff, duration, false)
    .then(instance => {
      console.log("Transfering ownership of ", instance.address);
      return instance.transferOwnership(newOwner)
    })
    .then(txHash => {
      console.log(txHash.logs[0].event);
    })
  })
}
