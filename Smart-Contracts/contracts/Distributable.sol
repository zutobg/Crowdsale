pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Distributable {

  using SafeMath for uint256;

  //Not actual addresses
  address[] public partners = [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x10];

  mapping(address => uint) public percentages;

  constructor(){
    //Not actual percentages
    percentages[0x01] = 1;
    percentages[0x02] = 1;
    percentages[0x03] = 1;
    percentages[0x04] = 1;
    percentages[0x05] = 1;
    percentages[0x06] = 1;
    percentages[0x07] = 1;
    percentages[0x08] = 1;
    percentages[0x09] = 1;
    percentages[0x10] = 1;
  }

  function checkPercentages(uint256 maxPercentage) public constant returns(bool check){
    uint256 counter = 0;
    for(uint i = 0; i < partners.length; i++){
      counter = counter.add(percentages[partners[i]]);
    }
    check = counter <= maxPercentage;
  }

}
