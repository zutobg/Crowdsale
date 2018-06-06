pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Distributable {

  using SafeMath for uint256;

  bool distributed;
  //Not actual addresses
  address[] public partners = [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x10];

  mapping(address => uint) public percentages;

  constructor(){
    //Not actual percentages
    percentages[0x01] = 10;
    percentages[0x02] = 10;
    percentages[0x03] = 10;
    percentages[0x04] = 10;
    percentages[0x05] = 10;
    percentages[0x06] = 10;
    percentages[0x07] = 10;
    percentages[0x08] = 10;
    percentages[0x09] = 10;
    percentages[0x10] = 10;
  }

  function checkPercentages(uint256 maxPercentage) public constant returns(bool check){
    uint256 counter = 0;
    for(uint i = 0; i < partners.length; i++){
      counter = counter.add(percentages[partners[i]]);
    }
    check = counter <= maxPercentage.mul(10);
  }

}
