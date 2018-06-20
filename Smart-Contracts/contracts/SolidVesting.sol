pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/TokenVesting.sol";

contract SolidVesting is TokenVesting {

  function changeBeneficiary(address newBeneficiary) public onlyOwner {
    beneficiary = newBeneficiary;
  }

}
