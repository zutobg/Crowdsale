pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Distributable {

  using SafeMath for uint256;

  bool public distributed;
  //Not all actual addresses
  address[] public partners = [
  0xb68342f2f4dd35d93b88081b03a245f64331c95c,
  0x16CCc1e68D2165fb411cE5dae3556f823249233e,
  0x0003, 0x0004, 0x0005, 0x0006, 0x0007, 0x0008, 0x0009, 0x0010, 0x0011, 0x0012];

  address[] public partnerFixedAmount = [
  0xA482D998DA4d361A6511c6847562234077F09748,
  0xFa92F80f8B9148aDFBacC66aA7bbE6e9F0a0CD0e
  ];

  mapping(address => uint256) public percentages;
  mapping(address => uint256) public fixedAmounts;

  constructor() public{
    percentages[0xb68342f2f4dd35d93b88081b03a245f64331c95c] = 40;
    percentages[0x16CCc1e68D2165fb411cE5dae3556f823249233e] = 5;
    percentages[0x0003] = 100;
    percentages[0x0004] = 50;
    percentages[0x0005] = 10;

    percentages[0x0006] = 20;
    percentages[0x0007] = 20;
    percentages[0x0008] = 20;
    percentages[0x0009] = 20;

    percentages[0x0010] = 30;
    percentages[0x0011] = 30;
    
    percentages[0x0012] = 52;

    fixedAmounts[0xA482D998DA4d361A6511c6847562234077F09748] = 886228 * 10**16;
    fixedAmounts[0xFa92F80f8B9148aDFBacC66aA7bbE6e9F0a0CD0e] = 697 ether;
  }
}
