
import latestTime from './helpers/latestTime.js';
import {duration} from './helpers/increaseTime.js';

const SolidifiedToken = artifacts.require('../SolidifiedToken.sol');
const TokenSale = artifacts.require('../TokenSale.sol');

const deployAndSetup = async (rate, wallet, presaleCap, publicSaleCap, initialDate)=> {
  let token = await SolidifiedToken.new();
  let sale = await TokenSale.new(rate, wallet, token.address, presaleCap, publicSaleCap);
  await token.transferOwnership(sale.address);
  await sale.setupSale(initialDate, token.address);

  return [token, sale, initialDate];
}

contract('TokenSale', (accounts) => {

  const rate = 15;
  const wallet = accounts[9];
  const presaleCap = 19200 * 10 ** 18;
  const publicSaleCap = 12000 * 10 ** 18;

  let token,sale = {};

  context("Contract deployment", () => {

    let date;

    before(async() =>{
      let now = await latestTime();
      const values = await deployAndSetup(rate, wallet, presaleCap, publicSaleCap, now);
      token = values[0];
      sale = values[1];
      date = values[2];
    })

    it("Contract is deployed with correct state", async () => {
      let r = await sale.rate();
      let prc = await sale.presale_Cap();
      let pbc = await sale.publicSale_Cap();
      let tk = await sale.token();
      let sd = await sale.presale_StartDate();
      let sed = await sale.presale_EndDate();
      let stage = await sale.currentStage();

      assert.equal(rate, r.toNumber());
      assert.equal(presaleCap, prc.toNumber());
      assert.equal(publicSaleCap, pbc.toNumber());
      assert.equal(token.address, tk);
      assert.equal(date, sd.toNumber());
      assert.equal(sed.toNumber(), date + duration.days(90));
      assert.equal(stage.toNumber(), 1);
    })
  })

  context("Buying funcionality", () =>{

    const buyer = accounts[2];
    const value = 2 * 10 ** 18;
    let date;

    before(async() =>{
      let initialDate = await latestTime();
      const values = await deployAndSetup(rate, wallet, presaleCap, publicSaleCap, initialDate);
      token = values[0];
      sale = values[1];
      date = values[2];
      await sale.addManyToWhitelist(accounts);
    })

    it("Accepts buys from whitelisted", async() =>{
      await sale.buyTokens(buyer, {value: value});
      let tokenBal = await token.balanceOf(buyer);
      let raised = await sale.weiRaised();
      assert.equal(tokenBal.toNumber(), 2 * 10 ** 18 / 0.012)
      assert.equal(raised.toNumber(), value);
    })



  })



  context("Stage Transitions", async() => {

    const newPresaleCap = presaleCap / 10 ** 21;
    const newPublicCap = publicSaleCap / 10 ** 21;

    before(async () =>{
      let now = await latestTime();
      const values = await deployAndSetup(rate, wallet, presaleCap, publicSaleCap, now);
      token = values[0];
      sale = values[1];
      now = values[2];
    })

  })

})
