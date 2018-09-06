pragma solidity 0.4.24;

import "../../contracts/TokenSale.sol";

contract TokenSaleMock is TokenSale {

  constructor(uint256 _rate, address _wallet, ERC20 _token) public TokenSale(_rate, _wallet, _token) {
  }


}
