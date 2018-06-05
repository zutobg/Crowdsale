
import latestTime from './helpers/latestTime.js';
import {duration, increaseTimeTo} from './helpers/increaseTime.js';
import assertRevert from './helpers/assertRevert';
import ether from './helpers/ether.js'

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
  const presaleCap = ether(19200);
  const publicSaleCap = ether(12000);

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
    const value = ether(2);
    let date;

    before(async() =>{
      let initialDate = await latestTime();
      const values = await deployAndSetup(rate, wallet, presaleCap, publicSaleCap, initialDate);
      token = values[0];
      sale = values[1];
      date = values[2];
      await sale.addManyToWhitelist(accounts);
    })

    it("Accepts buys from whitelisted", async() => {
      await sale.buyTokens(buyer, {value: value});
      let tokenBal = await token.balanceOf(buyer);
      let raised = await sale.weiRaised();
      assert.equal(tokenBal.toNumber(), ether(2) / 0.012)
      assert.equal(raised.toNumber(), value);
    })

    it("Rejects values below the minimum", async() => {
      const belowMinimum = ether(0.1);
      await assertRevert(sale.buyTokens(buyer, {value: belowMinimum}));
    })

    it("Returns values above the maximum", async() => {
      const aboveMax = ether(120);
      await web3.eth.sendTransaction({from: accounts[3], to: buyer, value: ether(90)});
      await sale.buyTokens(buyer, {from: buyer, value: aboveMax});
      const contribution = await sale.contributions(buyer);
      assert.equal(contribution.toNumber(), ether(100));
    })

  })



  context("Stage Transitions", async() => {

    const newPresaleCap = presaleCap / 1000;
    const newPublicCap = publicSaleCap / 1000;
    const buyer = accounts[4];

    let date;

    before(async () => {
      date = await latestTime();
      token = await SolidifiedToken.new();
      sale = await TokenSale.new(rate, wallet, token.address, newPresaleCap, newPublicCap);
      await token.transferOwnership(sale.address);
      await sale.addToWhitelist(buyer);
    })

    it("Deploys with stage SETUP", async() => {
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), 0);
    })

    it("Fails to update stage until setup is done", async () => {
      await sale.updateStage();
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), 0);
    })

    it("Update Stage after setup", async () => {
      await sale.setupSale(date + duration.days(1), token.address);
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), 1);
    })

    it("Fails to enter PRESALE until initial time reaches", async () => {
      await sale.updateStage();
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), 1);
    })

    it("Updates stages to PRESALE when inital time arrives", async () => {
      await increaseTimeTo(date + duration.days(2));
      await sale.updateStage();
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), 2);
    })

    it("It automatically updates do BREAK if presale cap is reached", async () => {
      await sale.buyTokens(buyer, {value: ether(15)});
      await sale.buyTokens(buyer, {value: ether(4.3)});
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), 3);
    })

    it("Fails to enter PUBLICSALE until initial time reaches", async () => {
      await sale.updateStage();
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), 3);
    })

    it("Updates stages to PUBLICSALE when inital time arrives", async () => {
      await increaseTimeTo(date + duration.days(15));
      await sale.updateStage();
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), 4);
    })

    it("It automatically updates do FINALAIZED if public sale cap is reached", async () => {
      await sale.buyTokens(buyer, {value: ether(14)});
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), 5);
    })

  })

})
