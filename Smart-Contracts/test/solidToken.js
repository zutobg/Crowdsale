import latestTime from './helpers/latestTime.js';
import {duration, increaseTimeTo} from './helpers/increaseTime.js';
import assertRevert from './helpers/assertRevert';
import ether from './helpers/ether.js'

const SolidToken = artifacts.require('../SolidToken.sol');
const TokenSale = artifacts.require('../TokenSale.sol');
const TokenSaleMock = artifacts.require('TokenSaleMock.sol');

contract("Solid Token", accounts => {

  it("Deploys correctly", async () => {
    
  })

})
