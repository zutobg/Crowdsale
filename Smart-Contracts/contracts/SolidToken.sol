pragma solidity 0.4.24;

import 'openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol';

contract SolidToken is MintableToken {

  string public constant name = "SolidToken";
  string public constant symbol = "SOLID";
  uint8  public constant decimals = 18;

  uint256 constant DECIMAL_PLACES = 10 ** 18;
  uint256 constant supplyCap = 4000000 * DECIMAL_PLACES;

  bool public transfersEnabled = false;
  uint256 public transferEnablingDate;


  /**
   * @dev Sets the date that the tokens becomes transferable
   * @param date The timestamp of the date
   * @return A boolean that indicates if the operation was successful.
   */
  function setTransferEnablingDate(uint256 date) public onlyOwner returns(bool success) {
    transferEnablingDate = date;
    return true;
  }


  /**
   * @dev Enables the token transfer
   */
  function enableTransfer() public {
    require(transferEnablingDate != 0 && now >= transferEnablingDate);
    transfersEnabled = true;
  }



  // OVERRIDES
  /**
   * @dev Function to mint tokens. Overriden to check for supply cap.
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(address _to, uint256 _amount) onlyOwner canMint public returns (bool) {
    require(totalSupply_.add(_amount) <= supplyCap);
    require(super.mint(_to, _amount));
    return true;
  }

  /**
  * @dev transfer token for a specified address
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
  function transfer(address _to, uint256 _value) public returns (bool) {
    require(transfersEnabled, "Tranfers are disabled");
    require(super.transfer(_to, _value));
    return true;
  }


  /**
   * @dev Transfer tokens from one address to another
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
   */
  function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
    require(transfersEnabled, "Tranfers are disabled");
    require(super.transferFrom(_from, _to, _value));
    return true;
  }


}
