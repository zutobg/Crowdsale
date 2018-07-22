const SolidVesting = artifacts.require('SolidVesting');
const MultiSigWallet = artifacts.require('MultiSigWallet');


module.exports = function (deployer, network, accounts) {

  // const start = 1540252800;
  // const cliff = 31536000;
  // const duration = 94608000;
  // const newOwner = "0x0acc23af96f4c43cf61e639cfc5c0937b9e07e7c";
  // let vests = [];
  // const addresses = [
  //   "0x3be72904acb1f83b3f25536d2391ecc567b7c3e6", // Alex
  //   "0x6eB4e59aB22ac614cf800D3CB6d086C19900e606", // Adam
  //   "0x79Aa29F3F84c84ed897D7a0eE77F73B51A3442B5", // ED
  //   "0x125b8e6f1d7e85eac84f2c0dbff46965b89bb1e7", //JG
  //   "0xB7CB5D597f498663CA33787eaeda4433B6EBD286", //Nick
  //   "0xaa0b244f8740d891f9b2d341eb27a49ca04a4dec", //Rob Hitchens
  //   "0x6C2975e008F00B05EcF132fF1e7B8E6333E17F83", // Rob Stone
  // ]
  //
  // deployer.then(async () => {
  //   for(let i = 0; i < addresses.length; i++){
  //     console.log("Deploying for ", addresses[i]);
  //     let vestContract = await SolidVesting.new(addresses[i], start, cliff, duration, false)
  //     console.log("Transfering owneship of" + addresses[i] + '\n');
  //     await vestContract.transferOwnership(newOwner);
  //     vests.push(vestContract.address);
  //   }
  // })
  // .then(() => {
  //   console.log("Deployed Vesting contracts: ");
  //   console.log(vests);
  // })


}
