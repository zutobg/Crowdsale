pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Distributable {

  using SafeMath for uint256;

  bool public distributed;
  //Not actual addresses
  address[] public partners = [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x10];

  mapping(address => uint256) public percentages;

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
  }

  /* function checkPercentages(uint256 maxPercentage) public view returns(bool check){
    uint256 counter = 0;
    for(uint i = 0; i < partners.length; i++){
      counter = counter.add(percentages[partners[i]]);
    }
    check = counter <= maxPercentage.mul(10);
  } */

}
