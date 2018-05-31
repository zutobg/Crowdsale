
import latestTime from './helpers/latestTime.js';
import {duration} from './helpers/increaseTime.js';

const SolidifiedToken = artifacts.require('../SolidifiedToken.sol');
const TokenSale = artifacts.require('../TokenSale.sol');

const deployAndSetup = async (rate, wallet, presaleCap, publicSaleCap, initialDate)=> {
  let token = await SolidifiedToken.new();
  let sale = await TokenSale.new(rate, wallet, token.address, presaleCap, publicSaleCap);
  await token.transferOwnership(sale.address);
  sale.setupSale(initialDate);
  sale.setUpToken(token.address);

  return [token, sale, now];
}

contract('TokenSale', (accounts) => {

  const rate = 100;
  const wallet = accounts[9];
  const presaleCap = 1000000 * 10 ** 18;
  const publicSaleCap = 500000 * 10 ** 18;

  let token,sale,now = {};

  context("Contract deployment", () => {

    before(async() =>{
      let now = await latestTime();
      const values = await deployAndSetup(rate, wallet, presaleCap, publicSaleCap, now);
      token = values[0];
      sale = values[1];
      now = values[2];
    })

    it("Contract is deployed with correct state", async () => {
      let r = await sale.rate();
      let prc = await sale.presaleCap();
      let pbc = await sale.publicSaleCap();
      let tk = await sale.token();
      let sd = await sale.presale_StartDate();
      let sed = await sale.presale_EndDate();
      let pd = await sale.publicSale_StartDate();
      let ped = await sale.publicSale_EndDate();
      let stage = await sale.currentStage();

      assert.equal(rate, r.toNumber());
      assert.equal(presaleCap, prc.toNumber());
      assert.equal(publicSaleCap, pbc.toNumber());
      assert.equal(token.address, tk);
      assert.equal(now, sd.toNumber());
      assert.equal(sed.toNumber(), now + duration.days(90));
      assert.equal(pd.toNumber(), now + duration.days(100));
      assert.equal(ped.toNumber(), now + duration.days(130));
      assert.equal(stage.toNumber(), 0);
    })
  })

  

  context("Stage Transitions", async() => {

    const newPresaleCap = presaleCap / 10 ** 21;
    const newPublicCap = publicSaleCap / 10 ** 21;

    before(async () =>{


    })

  })

})
