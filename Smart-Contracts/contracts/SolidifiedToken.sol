pragma solidity 0.4.24;

import 'openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol';

contract SolidifiedToken is MintableToken {

  string public constant name = "SolidifiedToken";
  string public constant symbol = "SOL";
  uint8  public constant decimals = 18;

  uint constant DECIMAL_CASES = 10 ** 18;

  uint constant supplyCap = 2500000 * DECIMAL_CASES;

  bool public transfersEnabled = false;


  constructor() public {

  }



  // OVERRIDES
  /**
   * @dev Function to mint tokens. Overriden to check for supply cap.
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(address _to, uint256 _amount) onlyOwner canMint public returns (bool) {
    require(totalSupply_.add(_amount) >= supplyCap);
    totalSupply_ = totalSupply_.add(_amount);
    balances[_to] = balances[_to].add(_amount);
    emit Mint(_to, _amount);
    emit Transfer(address(0), _to, _amount);
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
