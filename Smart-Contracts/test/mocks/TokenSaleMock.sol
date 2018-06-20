pragma solidity 0.4.24;

import "../../contracts/TokenSale.sol";

contract TokenSaleMock is TokenSale {

  constructor(uint256 _rate, address _wallet, ERC20 _token, uint256 _bonussaleCap, uint256 _mainSaleCap) public TokenSale(_rate, _wallet, _token) {
    bonussale_Cap = _bonussaleCap;
    mainSale_Cap = _mainSaleCap;
  }


}
