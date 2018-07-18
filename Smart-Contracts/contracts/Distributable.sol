pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Distributable {

  using SafeMath for uint256;

  bool public distributed;
  //Not actual addresses
  address[] public partners = [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x10];
  address[] public partnerFixedAmount = [0x011, 0x012];

  mapping(address => uint256) public percentages;
  mapping(address => uint256) public fixedAmounts;

  constructor() public{
    //Not actual percentages
    percentages[0x01] = 1;
    percentages[0x02] = 2;
    percentages[0x03] = 3;
    percentages[0x04] = 4;
    percentages[0x05] = 5;
    percentages[0x06] = 6;
    percentages[0x07] = 7;
    percentages[0x08] = 8;
    percentages[0x09] = 9;
    percentages[0x10] = 10;

    fixedAmounts[0x011] = 3000;
    fixedAmounts[0x012] = 9000;
  }
}
