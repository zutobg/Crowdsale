pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/TokenVesting.sol";

contract SolidVesting is TokenVesting {

  constructor(address _beneficiary,
    uint256 _start,
    uint256 _cliff,
    uint256 _duration,
    bool _revocable)
    public
    TokenVesting(_beneficiary, _start, _cliff, _duration, _revocable)
  {
    // Constructor needed for running migrations
  }

  /**
    @dev Change the reciever of the tokens
    @param newBeneficiary the address of the new beneficiary
  **/
  function changeBeneficiary(address newBeneficiary) public onlyOwner {
    beneficiary = newBeneficiary;
  }

}
