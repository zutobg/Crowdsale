
import latestTime from './helpers/latestTime.js';
import {duration, increaseTimeTo} from './helpers/increaseTime.js';
import assertRevert from './helpers/assertRevert';
import ether from './helpers/ether.js'

const SolidToken = artifacts.require('../SolidToken.sol');
const TokenSale = artifacts.require('../TokenSale.sol');
const TokenSaleMock = artifacts.require('TokenSaleMock.sol');

const deployAndSetup = async (rate, wallet, presaleCap, mainSaleCap, initialDate)=> {
  let token = await SolidToken.new();
  let sale = await TokenSaleMock.new(rate, wallet, token.address, presaleCap, mainSaleCap);
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
  const presaleDuration = duration.days(30);
  const mainsaleDuration = duration.days(60);
  const breakDuration = duration.days(0);

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
      assert.equal(sed.toNumber(), date + duration.days(30));
      assert.equal(stage.toNumber(), 1);
    })
  })

  context("Buying and finalization", () =>{

    const buyer = accounts[2];
    const buyer2 = accounts[5];
    const buyer3 = accounts[3];
    const buyer4 = accounts[4];
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
      await sale.buyTokens(buyer, {from: buyer, value: value});
      let tokenBal = await token.balanceOf(buyer);
      let raised = await sale.weiRaised();
      assert.equal(tokenBal.toNumber(), value / 0.012)
      assert.equal(raised.toNumber(), value);
    })

    it("Rejects values below the minimum", async() => {
      const belowMinimum = ether(0.1);
      await assertRevert(sale.buyTokens(buyer2, {from: buyer2, value: belowMinimum}));
    })

    it("Give changes correctly", async() => {
      const aboveMax = ether(120);
      await web3.eth.sendTransaction({from: accounts[3], to: buyer2, value: ether(90)});
      let initialBal = await web3.eth.getBalance(buyer2);
      let receipt = await sale.buyTokens(buyer2, {from: buyer2, value: aboveMax, gasPrice: 2});
      let endBalance = await web3.eth.getBalance(buyer2);
      let contribution = await sale.contributions(buyer2);
      let gasUsed = receipt.receipt.gasUsed * 2;
      assert.equal(initialBal.toNumber(), endBalance.toNumber() + ether(100).toNumber() + gasUsed);
      assert.equal(contribution.toNumber(), ether(100).toNumber());
    })

    it("Accepts below the minimum transaction if buyer has already purchased", async() => {
      const belowMinimum = ether(0.3);
      let initialCont = await sale.contributions(buyer);
      await sale.buyTokens(buyer, {from: buyer, value: belowMinimum});
      let endCont = await sale.contributions(buyer);
      assert.equal(initialCont.toNumber(), endCont.toNumber() - belowMinimum);
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
      await increaseTimeTo(date + presaleDuration + 10);
      await sale.saleOpen();
      //let pEndDate = await sale.presale_EndDate();
      //let pbStarDate = await sale.mainSale_StartDate();
      let preSold = await sale.presale_TokesSold();
      let preTkCap = await sale.presale_TokenCap();
      let preCap = await sale.presale_Cap();
      let preRaised = await sale.presale_WeiRaised()
      let pubTkCap = await sale.mainSale_TokenCap();
      let pubCap = await sale.mainSale_Cap();
      let stage = await sale.currentStage();
      assert.equal(pubTkCap.toNumber() / ether(1), (ether(800000).toNumber() + preTkCap.toNumber() - preSold.toNumber()) / ether(1));
      assert.equal(pubCap.toNumber(), ether(12000).toNumber() + preCap.toNumber() - preRaised.toNumber());
    })

    it("Gives correct amount of tokens for MAINSALE", async ()=>{
      let n = await latestTime();
      await increaseTimeTo(n + 1);
      await sale.buyTokens(buyer3, {value: value, from: buyer3});
      let cont1 = await sale.contributions(buyer3);
      let bal1 = await token.balanceOf(buyer3);
      const discountRate = rate / 1000;
      assert.equal((cont1.toNumber() / discountRate) / ether(1), bal1.toNumber() / ether(1));
    })

    it("Finalizes correctly the PublicSale", async() => {
      let n = await latestTime();
      await increaseTimeTo(n + mainsaleDuration + 2);
      await sale.saleOpen();
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
        assert.equal((bal.toNumber() / totalTokens).toFixed(3) , (i + 1) / 1000);
      }
    })

    it("Correctly sets the token state", async() => {
      let minting = await token.mintingFinished();
      assert.isTrue(minting);
    })

    it("Accounts correctly for tokens sold", async() => {
      let raised_pre = await sale.presale_WeiRaised();
      let raised_main = await sale.mainSale_WeiRaised();
      let raised = await sale.weiRaised();

      assert.equal(raised_pre.toNumber() + raised_main.toNumber(), raised.toNumber())
    })

  })

  context("Maintaing sale state", async() => {

    const buyer = accounts[8];
    const buyer2 = accounts[3];
    const buyer3 = accounts[6];
    const value = ether(5);
    let date;

    before(async () =>{
    let initialDate = await latestTime();
    const values = await deployAndSetup(rate, wallet, presaleCap, mainSaleCap, initialDate);
    token = values[0];
    sale = values[1];
    date = values[2];
    await sale.addManyToWhitelist(accounts);
    })

    it("Correctly accounts for purchases made from the other address", async() => {
      await sale.buyTokens(buyer, {from: buyer, value: value});
      let tokenBal = await token.balanceOf(buyer);
      let contributions = await sale.contributions(buyer);
      assert.equal(tokenBal.toNumber(), value / 0.012)
      assert.equal(contributions.toNumber(), value);
    })

    it("Correctly accounts for purchases made from same addresses", async() => {
      await sale.buyTokens(buyer2, {from: buyer2, value: value});
      let tokenBal = await token.balanceOf(buyer2);
      let contributions = await sale.contributions(buyer2);
      assert.equal(tokenBal.toNumber(), value / 0.012)
      assert.equal(contributions.toNumber(), value)
    })


  })

  context("Transactions in the cap gap", async() => {
    const newPresaleCap = presaleCap / 1000;
    const newPublicCap = mainSaleCap / 1000;
    const buyer = accounts[7];
    const buyer2 = accounts[6];
    let date;

    before(async () => {
    let initialDate = await latestTime();
    const values = await deployAndSetup(rate, wallet, newPresaleCap, newPublicCap, initialDate);
    token = values[0];
    sale = values[1];
    date = values[2];
    await sale.addManyToWhitelist(accounts);
    })

    it("Rejects below minimum purchase does not reach the cap", async () => {
      const almostCap = ether(19);
      const belowMinimum = ether(0.1);

      await sale.buyTokens(buyer, {value: almostCap, from: buyer});
      await assertRevert(sale.buyTokens(buyer2, {value: belowMinimum, from: buyer2}));
    })

    it("Accepts transaction if it reaches the cap", async() => {
      const belowMinimum = ether(0.4);
      let cap = await sale.getCurrentCap();
      let raised = await sale.getRaisedForCurrentStage();
      sale.buyTokens(buyer2, {value: belowMinimum, from: buyer2})
      let contribution = await sale.contributions(buyer2);
      assert.equal(contribution.toNumber(), cap.toNumber() - raised.toNumber());
    })
  })



  context("Stage Transitions - Reaching Cap", async() => {

    const newPresaleCap = presaleCap / 1000;
    const newPublicCap = mainSaleCap / 1000;
    const buyer = accounts[4];

    let date;

    before(async () => {
      date = await latestTime();
      token = await SolidToken.new();
      sale = await TokenSaleMock.new(rate, wallet, token.address, newPresaleCap, newPublicCap);
      await token.transferOwnership(sale.address);
      await sale.addToWhitelist(buyer);
    })

    it("Deploys with stage SETUP", async() => {
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), 0);
    })

    it("Fails to process purchase in SETUP stage", async () => {
      await assertRevert(sale.buyTokens(buyer, {value: ether(15)}));
    })

    it("Fails to update stage until setup is done", async () => {
      await sale.saleOpen();
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), 0);
    })

    it("Update to READY after setup", async () => {
      await sale.setupSale(date + duration.days(1), token.address);
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), 1);
    })


    it("Fails to process purchase in READY stage", async () => {
      await assertRevert(sale.buyTokens(buyer, {value: ether(15)}));
    })

    it("Fails to enter PRESALE until initial time reaches", async () => {
      await sale.saleOpen();
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), 1);
    })

    it("Updates stages to PRESALE when inital time arrives", async () => {
      await increaseTimeTo(date + duration.days(2));
      await sale.saleOpen();
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), 2);
    })

    it("It automatically updates do BREAK if presale cap is reached", async () => {
      await sale.buyTokens(buyer, {from: buyer, value: ether(15)});
      await sale.buyTokens(buyer, {from: buyer, value: ether(4.3)});
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), 3);
    })


    // it("Fails to process purchase in BREAK stage", async () => {
    //   await assertRevert(sale.buyTokens(buyer, {from: buyer, value: ether(15)}));
    // })

    // it("Fails to enter MAINSALE until initial time reaches", async () => {
    //
    //   let t = await latestTime();
    //   console.log(t);
    //   await sale.saleOpen();
    //   let stage = await sale.currentStage();
    //   assert.equal(stage.toNumber(), 3);
    // })

    it("Updates stages to MAINSALE when inital time arrives", async () => {
      let t = await latestTime();
      await increaseTimeTo(t + 2);
      await sale.saleOpen();
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), 4);
    })

    it("It automatically updates do FINALAIZED if public sale cap is reached", async () => {
      let stage = await sale.currentStage();
      await sale.buyTokens(buyer, {from: buyer, value: ether(14)})

      assert.equal(stage.toNumber(), 4);
    })

    it("Fails to process purchase in FINALAIZED stage", async () => {
      await assertRevert(sale.buyTokens(buyer, {from:buyer ,value: ether(15)}));
    })
  })


})
