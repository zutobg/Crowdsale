pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Distributable {

  using SafeMath for uint256;

  bool public distributed;
  //Not all actual addresses
  address[] public partners = [
  0xb68342f2f4dd35d93b88081b03a245f64331c95c,
  0x16CCc1e68D2165fb411cE5dae3556f823249233e,
  0x8E176EDA10b41FA072464C29Eb10CfbbF4adCd05, //Auditors Traning
  0x7c387c57f055993c857067A0feF6E81884656Cb0, //Reserve
  0x4F21c073A9B8C067818113829053b60A6f45a817, //Airdrop
  0xcB4b6B7c4a72754dEb99bB72F1274129D9C0A109, //Alex
  0x7BF84E0244c05A11c57984e8dF7CC6481b8f4258, //Adam
  0x20D2F4Be237F4320386AaaefD42f68495C6A3E81, //JG
  0x12BEA633B83aA15EfF99F68C2E7e14f2709802A9, //Rob S
  0xC1a29a165faD532520204B480D519686B8CB845B, //Nick
  0xf5f5Eb6Ab1411935b321042Fa02a433FcbD029AC, //Rob H
  0xaBff978f03d5ca81B089C5A2Fc321fB8152DC8f1]; //Ed

  address[] public partnerFixedAmount = [
  0xA482D998DA4d361A6511c6847562234077F09748,
  0xFa92F80f8B9148aDFBacC66aA7bbE6e9F0a0CD0e
  ];

  mapping(address => uint256) public percentages;
  mapping(address => uint256) public fixedAmounts;

  constructor() public{
    percentages[0xb68342f2f4dd35d93b88081b03a245f64331c95c] = 40;
    percentages[0x16CCc1e68D2165fb411cE5dae3556f823249233e] = 5;
    percentages[0x8E176EDA10b41FA072464C29Eb10CfbbF4adCd05] = 100; //Auditors Training
    percentages[0x7c387c57f055993c857067A0feF6E81884656Cb0] = 50; //Reserve
    percentages[0x4F21c073A9B8C067818113829053b60A6f45a817] = 10; //Airdrop

    percentages[0xcB4b6B7c4a72754dEb99bB72F1274129D9C0A109] = 20; //Alex
    percentages[0x7BF84E0244c05A11c57984e8dF7CC6481b8f4258] = 20; //Adam
    percentages[0x20D2F4Be237F4320386AaaefD42f68495C6A3E81] = 20; //JG
    percentages[0x12BEA633B83aA15EfF99F68C2E7e14f2709802A9] = 20; //Rob S

    percentages[0xC1a29a165faD532520204B480D519686B8CB845B] = 30; //Nick
    percentages[0xf5f5Eb6Ab1411935b321042Fa02a433FcbD029AC] = 30; //Rob H

    percentages[0xaBff978f03d5ca81B089C5A2Fc321fB8152DC8f1] = 52; //Ed

    fixedAmounts[0xA482D998DA4d361A6511c6847562234077F09748] = 886228 * 10**16;
    fixedAmounts[0xFa92F80f8B9148aDFBacC66aA7bbE6e9F0a0CD0e] = 697 ether;
  }
}
