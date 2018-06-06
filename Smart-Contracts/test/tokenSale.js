
import latestTime from './helpers/latestTime.js';
import {duration, increaseTimeTo} from './helpers/increaseTime.js';
import assertRevert from './helpers/assertRevert';
import ether from './helpers/ether.js'

const SolidToken = artifacts.require('../SolidToken.sol');
const TokenSale = artifacts.require('../TokenSale.sol');

const deployAndSetup = async (rate, wallet, presaleCap, mainSaleCap, initialDate)=> {
  let token = await SolidToken.new();
  let sale = await TokenSale.new(rate, wallet, token.address, presaleCap, mainSaleCap);
  await token.transferOwnership(sale.address);
  await sale.setupSale(initialDate, token.address);

  return [token, sale, initialDate];
}

contract('TokenSale', (accounts) => {

  const rate = 15;
  const wallet = accounts[9];
  const presaleCap = ether(19200);
  const presaleTokenCap = ether(1600000);
  const mainSaleCap = ether(12000);
  const mainSaleTokenCap = ether(800000);

  let token,sale = {};

  context("Contract deployment", () => {

    let date;

    before(async() =>{
      let now = await latestTime();
      const values = await deployAndSetup(rate, wallet, presaleCap, mainSaleCap, now);
      token = values[0];
      sale = values[1];
      date = values[2];
    })

    it("Contract is deployed with correct state", async () => {
      let r = await sale.rate();
      let prc = await sale.presale_Cap();
      let prct = await sale.presale_TokenCap();
      let pbc = await sale.mainSale_Cap();
      let pbct = await sale.mainSale_TokenCap();
      let tk = await sale.token();
      let sd = await sale.presale_StartDate();
      let sed = await sale.presale_EndDate();
      let stage = await sale.currentStage();

      assert.equal(rate, r.toNumber());
      assert.equal(presaleCap, prc.toNumber());
      assert.equal(presaleTokenCap, prct.toNumber());
      assert.equal(mainSaleCap, pbc.toNumber());
      assert.equal(mainSaleTokenCap, pbct.toNumber());
      assert.equal(token.address, tk);
      assert.equal(date, sd.toNumber());
      assert.equal(sed.toNumber(), date + duration.days(90));
      assert.equal(stage.toNumber(), 1);
    })
  })

  context("Buying and finalization", () =>{

    const buyer = accounts[2];
    const buyer2 = accounts[5];
    const buyer3 = accounts[3];
    const value = ether(3);
    let date;

    before(async() =>{
      let initialDate = await latestTime();
      const values = await deployAndSetup(rate, wallet, presaleCap, mainSaleCap, initialDate);
      token = values[0];
      sale = values[1];
      date = values[2];
      await sale.addManyToWhitelist(accounts);
    })

    it("Accepts buys from whitelisted", async() => {
      await sale.buyTokens(buyer, {value: value});
      let tokenBal = await token.balanceOf(buyer);
      let raised = await sale.weiRaised();
      assert.equal(tokenBal.toNumber(), value / 0.012)
      assert.equal(raised.toNumber(), value);
    })

    it("Rejects values below the minimum", async() => {
      const belowMinimum = ether(0.1);
      await assertRevert(sale.buyTokens(buyer, {value: belowMinimum}));
    })

    it("Give changes correctly", async() => {
      const aboveMax = ether(120);
      await web3.eth.sendTransaction({from: accounts[3], to: buyer2, value: ether(90)});
      let initialBal = await web3.eth.getBalance(buyer2);
      await sale.buyTokens(buyer2, {from: buyer2, value: aboveMax});
      let endBalance = await web3.eth.getBalance(buyer2);
      let contribution = await sale.contributions(buyer2);
      assert.equal(contribution.toNumber(), ether(100).toNumber());
    })

    it("Gives correct amount of tokens for PRESALE", async ()=>{
      let cont1 = await sale.contributions(buyer);
      let cont2 = await sale.contributions(buyer2);
      let bal1 = await token.balanceOf(buyer);
      let bal2 = await token.balanceOf(buyer2);
      const discountRate = rate * 0.8 / 1000;
      assert.equal(cont1.toNumber() / discountRate, bal1.toNumber());
      assert.equal(cont2.toNumber() / discountRate, bal2.toNumber());
    })

    it("Transfer funds correctly to the wallet", async () => {
      let cont1 = await sale.contributions(buyer);
      let cont2 = await sale.contributions(buyer2);
      let bal = await web3.eth.getBalance(wallet);
      let profit = bal.toNumber() - ether(100);
      assert.equal(cont1.toNumber() + cont2.toNumber(), profit);
    })

    it("Finalizes correctly the presale", async()=>{
      await increaseTimeTo(date + duration.days(91));
      await sale.updateStage();
      let pEndDate = await sale.presale_EndDate();
      let pbStarDate = await sale.mainSale_StartDate();
      let preSold = await sale.presale_TokesSold();
      let preTkCap = await sale.presale_TokenCap();
      let preCap = await sale.presale_Cap();
      let preRaised = await sale.presale_WeiRaised()
      let pubTkCap = await sale.mainSale_TokenCap();
      let pubCap = await sale.mainSale_Cap();

      assert.equal(pubTkCap.toNumber(), ether(800000).toNumber() + preTkCap.toNumber() - preSold.toNumber());
      assert.equal(pubCap.toNumber(), ether(12000).toNumber() + preCap.toNumber() - preRaised.toNumber());
    })

    it("Gives correct amount of tokens for MAINSALE", async ()=>{
      await increaseTimeTo(date + duration.days(102));
      await sale.buyTokens(buyer3, {value: value});
      let cont1 = await sale.contributions(buyer3);
      let bal1 = await token.balanceOf(buyer3);
      const discountRate = rate / 1000;
      assert.equal((cont1.toNumber() / discountRate) / ether(1), bal1.toNumber() / ether(1));
    })

    it("Finalizes correctly the PublicSale", async() => {
      await increaseTimeTo(date + duration.days(150));
      await sale.updateStage();
      let stage = await sale.currentStage();
      let dateToken = await token.transferEnablingDate();
      let now = await latestTime();
      assert.equal(stage.toNumber(), 5)
      assert.isTrue(dateToken.toNumber() - (now + duration.days(182)) < 1)
    })

    it("Distributes the token correctly", async() => {
      const partAdd = ["0x01", "0x02", "0x03", "0x04", "0x05", "0x06", "0x07", "0x08","0x09", "0x10"];
      let supply = await token.totalSupply();
      let totalTokens = supply.toNumber() * 10 / 6
      await sale.distributeTokens();
      for(var i = 0; i < partAdd.length; i++){
        let bal = await token.balanceOf(partAdd[i]);
        assert.equal(bal.toNumber() / totalTokens , 0.01);
      }
    })

  })



  context("Stage Transitions", async() => {

    const newPresaleCap = presaleCap / 1000;
    const newPublicCap = mainSaleCap / 1000;
    const buyer = accounts[4];

    let date;

    before(async () => {
      date = await latestTime();
      token = await SolidToken.new();
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

    it("Fails to enter MAINSALE until initial time reaches", async () => {
      await sale.updateStage();
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), 3);
    })

    it("Updates stages to MAINSALE when inital time arrives", async () => {
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
