
import latestTime from './helpers/latestTime.js';
import {duration, increaseTimeTo} from './helpers/increaseTime.js';
import assertRevert from './helpers/assertRevert';
import ether from './helpers/ether.js'

const SolidToken = artifacts.require('../SolidToken.sol');
const TokenSale = artifacts.require('../TokenSale.sol');
const TokenSaleMock = artifacts.require('TokenSaleMock.sol');

const deployAndSetup = async (rate, wallet, bonussaleCap, mainSaleCap, initialDate)=> {
  let token = await SolidToken.new();
  let sale = await TokenSaleMock.new(rate, wallet, token.address, bonussaleCap, mainSaleCap);
  await token.transferOwnership(sale.address);
  await sale.setupSale(initialDate, token.address);

  return [token, sale, initialDate];
}

contract('TokenSale', (accounts) => {

  const rate = 15;
  const wallet = accounts[9];
  const bonussaleCap = ether(14400).toNumber();
  const bonussaleTokenCap = ether(1200000).toNumber();
  const mainSaleCap = ether(18000).toNumber();
  const mainSaleTokenCap = ether(1200000).toNumber();
  const bonussaleDuration = duration.days(30);
  const mainsaleDuration = duration.days(62);
  const breakDuration = duration.days(0);
  const stages = {
    "setup": 0,
    "ready": 1,
    "bonussale": 2,
    "mainsale": 3,
    "finalized": 4,
  }

  let token,sale = {};

  context("Contract deployment", () => {

    let date;

    before(async() =>{
      let now = await latestTime();
      const values = await deployAndSetup(rate, wallet, bonussaleCap, mainSaleCap, now);
      token = values[0];
      sale = values[1];
      date = values[2];
    })

    it("Contract is deployed with correct state", async () => {
      let r = await sale.rate();
      let prc = await sale.bonussale_Cap();
      let prct = await sale.bonussale_TokenCap();
      let pbc = await sale.mainSale_Cap();
      let pbct = await sale.mainSale_TokenCap();
      let tk = await sale.token();
      let sd = await sale.bonussale_StartDate();
      let sed = await sale.bonussale_EndDate();
      let stage = await sale.currentStage();

      assert.equal(rate, r.toNumber());
      assert.equal(bonussaleCap, prc.toNumber());
      assert.equal(bonussaleTokenCap, prct.toNumber());
      assert.equal(mainSaleCap, pbc.toNumber());
      assert.equal(mainSaleTokenCap, pbct.toNumber());
      assert.equal(token.address, tk);
      assert.equal(date, sd.toNumber());
      assert.equal(sed.toNumber(), date + duration.days(30));
      assert.equal(stage.toNumber(), stages["ready"]);
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
      const values = await deployAndSetup(rate, wallet, bonussaleCap, mainSaleCap, initialDate);
      token = values[0];
      sale = values[1];
      date = values[2];
      await sale.addManyToWhitelist(accounts);
    })

    it("Accepts buys from whitelisted", async() => {
      let tx = await sale.buyTokens(buyer, {from: buyer, value: value});
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
      let receipt = await sale.buyTokens(buyer2, {from: buyer2, value: aboveMax, gasPrice: 1});
      let endBalance = await web3.eth.getBalance(buyer2);
      let contribution = await sale.contributions(buyer2);
      let gasUsed = receipt.receipt.gasUsed;
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

    it("Finalizes correctly the bonussale", async()=>{
      await increaseTimeTo(date + bonussaleDuration + 10);
      await sale.saleOpen();
      //let pEndDate = await sale.bonussale_EndDate();
      //let pbStarDate = await sale.mainSale_StartDate();
      let preSold = await sale.bonussale_TokesSold();
      let preTkCap = await sale.bonussale_TokenCap();
      let preCap = await sale.bonussale_Cap();
      let preRaised = await sale.bonussale_WeiRaised()
      let pubTkCap = await sale.mainSale_TokenCap();
      let pubCap = await sale.mainSale_Cap();
      let stage = await sale.currentStage();
      assert.equal(pubTkCap.toNumber() / ether(1), (bonussaleTokenCap + preTkCap.toNumber() - preSold.toNumber()) / ether(1));
      assert.equal(pubCap.toNumber(), mainSaleCap + preCap.toNumber() - preRaised.toNumber());
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
      assert.equal(stage.toNumber(), stages["finalized"]);
      assert.isTrue(dateToken.toNumber() - (now + duration.days(182)) < 1)
    })

    it("Distributes the token correctly", async() => {
      const partAdd = ["0xb68342f2f4dd35d93b88081b03a245f64331c95c",
        "0x16CCc1e68D2165fb411cE5dae3556f823249233e",
        "0x8E176EDA10b41FA072464C29Eb10CfbbF4adCd05", "0x7c387c57f055993c857067A0feF6E81884656Cb0", "0x4F21c073A9B8C067818113829053b60A6f45a817", "0xcB4b6B7c4a72754dEb99bB72F1274129D9C0A109", "0x7BF84E0244c05A11c57984e8dF7CC6481b8f4258", "0x20D2F4Be237F4320386AaaefD42f68495C6A3E81", "0x12BEA633B83aA15EfF99F68C2E7e14f2709802A9", "0xC1a29a165faD532520204B480D519686B8CB845B", "0xf5f5Eb6Ab1411935b321042Fa02a433FcbD029AC", "0xaBff978f03d5ca81B089C5A2Fc321fB8152DC8f1"];
      const partPercent = [40,5,100,50,10,20,20,20,20,30,30,52];
      let supply = await token.totalSupply();
      let totalTokens = supply.toNumber() * 10 / 6
      await sale.distributeTokens();
      for(var i = 0; i < partAdd.length; i++){
        let bal = await token.balanceOf(partAdd[i]);
        assert.equal((bal.toNumber() / totalTokens).toFixed(3) , (partPercent[i]) / 1000);
      }
      const fixedPartAdd = ["0xA482D998DA4d361A6511c6847562234077F09748", "0xFa92F80f8B9148aDFBacC66aA7bbE6e9F0a0CD0e"]
      const fixedAmounts = [8862.28,697]
      for(var j = 0; j < fixedPartAdd.length; j++){
        let bal = await token.balanceOf(fixedPartAdd[j]);
        assert.equal(bal.toNumber(),ether(fixedAmounts[j]));
      }
    })

    it("Correctly sets the token state", async() => {
      let minting = await token.mintingFinished();
      assert.isTrue(minting);
    })

    it("Accounts correctly for tokens sold", async() => {
      let raised_pre = await sale.bonussale_WeiRaised();
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
    const values = await deployAndSetup(rate, wallet, bonussaleCap, mainSaleCap, initialDate);
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
    const newPresaleCap = bonussaleCap / 1000;
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
      const almostCap = ether(14);
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

    const newPresaleCap = bonussaleCap / 1000;
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
      assert.equal(stage.toNumber(), stages["setup"]);
    })

    it("Fails to process purchase in SETUP stage", async () => {
      await assertRevert(sale.buyTokens(buyer, {value: ether(15)}));
    })

    it("Fails to update stage until setup is done", async () => {
      await sale.saleOpen();
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), stages["setup"]);
    })

    it("Update to READY after setup", async () => {
      await sale.setupSale(date + duration.days(1), token.address);
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), stages["ready"]);
    })


    it("Fails to process purchase in READY stage", async () => {
      await assertRevert(sale.buyTokens(buyer, {value: ether(15)}));
    })

    it("Fails to enter PRESALE until initial time reaches", async () => {
      await sale.saleOpen();
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), stages["ready"]);
    })

    it("Updates stages to PRESALE when inital time arrives", async () => {
      await increaseTimeTo(date + duration.days(2));
      await sale.saleOpen();
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), stages["bonussale"]);
    })

    it("It automatically updates do MAINSALE if bonussale cap is reached", async () => {
      await sale.buyTokens(buyer, {from: buyer, value: ether(15)});
      await sale.buyTokens(buyer, {from: buyer, value: ether(4.3)});
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), stages["mainsale"]);
    })


    it("Updates stages to MAINSALE when inital time arrives", async () => {
      let t = await latestTime();
      await increaseTimeTo(t + 2);
      await sale.saleOpen();
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), stages["mainsale"]);
    })

    it("It automatically updates do FINALIZED if public sale cap is reached", async () => {
      await sale.buyTokens(buyer, {from: buyer, value: ether(19)})
      let stage = await sale.currentStage();
      assert.equal(stage.toNumber(), stages["finalized"]);
    })

    it("Fails to process purchase in FINALIZED stage", async () => {
      await assertRevert(sale.buyTokens(buyer, {from:buyer ,value: ether(15)}));
    })

    it("Distributes the token correctly when cap is Reached", async() => {
      const partAdd = ["0xb68342f2f4dd35d93b88081b03a245f64331c95c",
        "0x16CCc1e68D2165fb411cE5dae3556f823249233e",
        "0x8E176EDA10b41FA072464C29Eb10CfbbF4adCd05", "0x7c387c57f055993c857067A0feF6E81884656Cb0", "0x4F21c073A9B8C067818113829053b60A6f45a817", "0xcB4b6B7c4a72754dEb99bB72F1274129D9C0A109", "0x7BF84E0244c05A11c57984e8dF7CC6481b8f4258", "0x20D2F4Be237F4320386AaaefD42f68495C6A3E81", "0x12BEA633B83aA15EfF99F68C2E7e14f2709802A9", "0xC1a29a165faD532520204B480D519686B8CB845B", "0xf5f5Eb6Ab1411935b321042Fa02a433FcbD029AC", "0xaBff978f03d5ca81B089C5A2Fc321fB8152DC8f1"];
      const partPercent = [40,5,100,50,10,20,20,20,20,30,30,52];
      let supply = await token.totalSupply();
      let totalTokens = supply.toNumber() * 10 / 6
      await sale.distributeTokens();
      for(var i = 0; i < partAdd.length; i++){
        let bal = await token.balanceOf(partAdd[i]);
        assert.equal((bal.toNumber() / totalTokens).toFixed(3) , (partPercent[i]) / 1000);
      }
      const fixedPartAdd = ["0xA482D998DA4d361A6511c6847562234077F09748", "0xFa92F80f8B9148aDFBacC66aA7bbE6e9F0a0CD0e"]
      const fixedAmounts = [8862.28,697]
      for(var j = 0; j < fixedPartAdd.length; j++){
        let bal = await token.balanceOf(fixedPartAdd[j]);
        assert.equal(bal.toNumber(),ether(fixedAmounts[j]));
      }
    })

    it("Testing ditrubte token function", async() => {
      const dt = function(tokensSold, partnersAdd, partnersPercent) {
        let resultBal = [];
        let totalTokens = tokensSold * 10 / 6;
        console.log(totalTokens);
        for(let i =0; i < partnersAdd.length; i++){
          let amount = partnersPercent[i] * totalTokens / 1000;
          resultBal.push(amount);
        }
        return resultBal
      }
      const partAdd = ["0xb68342f2f4dd35d93b88081b03a245f64331c95c",
        "0x16CCc1e68D2165fb411cE5dae3556f823249233e",
        "0x8E176EDA10b41FA072464C29Eb10CfbbF4adCd05", "0x7c387c57f055993c857067A0feF6E81884656Cb0", "0x4F21c073A9B8C067818113829053b60A6f45a817", "0xcB4b6B7c4a72754dEb99bB72F1274129D9C0A109", "0x7BF84E0244c05A11c57984e8dF7CC6481b8f4258", "0x20D2F4Be237F4320386AaaefD42f68495C6A3E81", "0x12BEA633B83aA15EfF99F68C2E7e14f2709802A9", "0xC1a29a165faD532520204B480D519686B8CB845B", "0xf5f5Eb6Ab1411935b321042Fa02a433FcbD029AC", "0xaBff978f03d5ca81B089C5A2Fc321fB8152DC8f1"];
      const partPercent = [40,5,100,50,10,20,20,20,20,30,30,52];
      let t1 = dt(2400000, partAdd, partPercent);
      let t11 = t1.reduce((a, b) => a + b, 0)
    })
  })


})
