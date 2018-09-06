pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Distributable {

  using SafeMath for uint256;

  bool public distributed;
  //Not all actual addresses
  address[] public partners = [
  /**
  TODO re-deploy vesting contracts
  **/
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

  mapping(address => uint256) public tokenAmounts;

  constructor() public{
    tokenAmounts[0xb68342f2f4dd35d93b88081b03a245f64331c95c] = 1600000; //Private Sale Wallet - 1.6MM
    tokenAmounts[0x16CCc1e68D2165fb411cE5dae3556f823249233e] = 400000; // Marketing and Community tokens - 400k
    tokenAmounts[0x4F21c073A9B8C067818113829053b60A6f45a817] = 200000; //Airdrop and Bounty - 200k


    // Team Vesting - total 800k
    tokenAmounts[0xcB4b6B7c4a72754dEb99bB72F1274129D9C0A109] = 80000; //Alex
    tokenAmounts[0x7BF84E0244c05A11c57984e8dF7CC6481b8f4258] = 80000; //Adam
    tokenAmounts[0x20D2F4Be237F4320386AaaefD42f68495C6A3E81] = 80000; //JG
    tokenAmounts[0x12BEA633B83aA15EfF99F68C2E7e14f2709802A9] = 80000; //Rob S
    tokenAmounts[0xC1a29a165faD532520204B480D519686B8CB845B] = 120000; //Nick
    tokenAmounts[0xf5f5Eb6Ab1411935b321042Fa02a433FcbD029AC] = 120000; //Rob H
    tokenAmounts[0xaBff978f03d5ca81B089C5A2Fc321fB8152DC8f1] = 240000; //Ed

    // Partners - total 200k
    // INCLUDE THOSE ON PARTNERS?
    /* tokenAmounts[0xA482D998DA4d361A6511c6847562234077F09748] = 886228 * 10**16;
    tokenAmounts[0xFa92F80f8B9148aDFBacC66aA7bbE6e9F0a0CD0e] = 697 ether; */

  }
}
