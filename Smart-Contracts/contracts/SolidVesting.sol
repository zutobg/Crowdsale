pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/TokenVesting.sol";

contract SolidVesting is TokenVesting {

  /**
    @dev Change the reciever of the tokens
    @param newBeneficiary the address of the new beneficiary
  **/
  function changeBeneficiary(address newBeneficiary) public onlyOwner {
    beneficiary = newBeneficiary;
  }

}
