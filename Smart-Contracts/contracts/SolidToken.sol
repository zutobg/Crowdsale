pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "./Distributable.sol";

contract SolidToken is MintableToken, Dustributable {

  string public constant name = "SolidToken";
  string public constant symbol = "SOLID";
  uint8  public constant decimals = 18;

  uint256 constant private DECIMAL_PLACES = 10 ** 18;
  uint256 constant SUPPLY_CAP = 4000000 * DECIMAL_PLACES;

  mapping(address => bool) public superusers;

  bool public transfersEnabled = false;
  uint256 public transferEnablingDate;



  /**
   * @dev Enables the token transfer
   */
  modifier transfersEnabled() public {
    require(now >= transferEnablingDate || superusers[msg.sender]);
  }


  function constructor() public {
    //Mint intial TokenSale
    for(uint i = 0; i < partners.length; i++){
      uint256 amount = percentages[partners[i]].mul(DECIMAL_PLACES)
      mint(partners[i], amount);
    }

    //Other config
    transferEnablingDate = now + 182 days;
  }

  /**
   * @dev Enables the token transfer
   */
  function enableTransfer() public {
    require(now >= transferEnablingDate);
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
    require(totalSupply_.add(_amount) <= SUPPLY_CAP);
    require(super.mint(_to, _amount));
    return true;
  }

  /**
  * @dev transfer token for a specified address
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
  function transfer(address _to, uint256 _value) public transfersEnabled returns (bool) {
    require(super.transfer(_to, _value));
    return true;
  }


  /**
   * @dev Transfer tokens from one address to another
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
   */
  function transferFrom(address _from, address _to, uint256 _value) public transfersEnabled returns (bool) {
    require(super.transferFrom(_from, _to, _value));
    return true;
  }

}
