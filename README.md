# Crowdsale and Token Details

## SOLID Token Details
* ERC20 mintable token
* 18 decimal places
* 1 Solid token = 0.015 ETH

* Total max supply: 4,000,000 SOLID tokens


6-month lock period on all sold tokens, from the end of the main sale.

## Sale Details
### Targeted Presale
- Targeted at auditors, Ethereum projects, developers and security experts
- Cap of 1,600,000 SOLID tokens(40% of the total supply @ 20% discount)
- Duration: max 3 months
- Discount: 20%

If less than 1,600,000 SOLID tokens are sold during presale, the remaining limit carries over to the main sale.

### Main Sale
- Total cap for both sales to be 2,400,000 SOLID tokens.
- Length: 1 month
- No discount

### General Rules
- No Soft Cap (no Refunds).
- No Token Burning
- Minimum Participation: 0.5 ETH
- Maximum Participation: 100 ETH
- Funds are sent to a multisig ETH
- Auction type: static price
- Only ETH is accepted
- KYC whitelisted addresses only


After both sales are finished:
Dedicated function to Solidified and partners:

The total supply is determined by how much we sell during Presale + Main sale(which will represent 60% of the existing tokens)

Afterwards tokens will be minted to:
* Team Fund (20% of total supply)
Vesting: 1 year cliff, 3 year total.
* Community & Audit Training Fund (10% of total supply)
* Economics Reserve (5% of total supply)
* Airdrops (0.5% of total supply)


__Whale protection:__  Combination of maximum participation limit and KYC’d addresses.

__Edge Cases:__ Last transaction for either of the sales should get refunded whatever it sent over.

## Intended Behavior

The sale is based on the Open Zeppelin framework, with a few additions, the biggest one being stages, because there will be multiple phases.

1) Sale is deployed with `SETUP`.
2) After configuration the sale move to `READY`.
3) When the start date arrives the sale should go to `PRESALE`(either by calling `updateStage` or making a purchase), since it's resolved in `timedTransition`
3) The `PRESALE` stage ends when either the cap is reached or the endTime arrives.
  3.a) If the cap is reached the stage will move during the last transaction in the `_postValidatePurchase`
  3.b) If the time is reached, the transition must happen in `updateStage`, since making a purchase will revert the stage.
  3.c) If the sale enter the state where the cap haven't been reached but the remaining amount is less than the minimum purchase, the transition should happen in `updateStage`;
4) the `BREAK` stage should last 10 days(counting from the finalization).
5) The `MAINSALE` should start when the time arrives, either by calling `updateStage` or making a purchase.
6) The `MAINSALE` stage ends when either the cap is reached or the endTime arrives.
  3.a) If the cap is reached the stage will move during the last transaction in the `_postValidatePurchase`
  3.b) If the time is reached, the transition must happen in `updateStage`, since making a purchase will revert the stage.
  3.c) If the sale enter the state where the cap haven't been reached but the remaining amount is less than the minimum purchase, the transition should happen in `updateStage`;


The other meaningful addition is the `changeDue` and `capReached` variables.

The change is needed when a purchase is overpaid, either when a buyer sends more than the personal cap or more than what is available. This should be calculated in `_preValidatePurchase` and saved in the storage to be transferred back to the buyer in the `_postValidatePurchase`.

All the sale parameters should be increased considering only the accepted amount.

Lastly, there's the added mechanism for minting and distributing the non-sale tokens.
The values will be harcoded in the `Distributable.sol` with percentages. When the sale is finalized the tokens will be distributed following the rule:

* The amount sold in both sale stages will be 60% of the total Tokens
* The other addresses percentages must account up to 40%
* If a give address has rights to 5%, it means that it will receive 5% of the total tokens(even if not all of them are minted yet);

The `distributeTokens` functions one of the few owner restricted function(although it doesn't need to be);

##### Note on units
Given the solidity restriction to floating point numbers, some variable are considered differently.
* The `rate` will be divided by `1000`. A rate of `15` actually means `0.015`. This is considered in the contracts
* The `percentages` will be divided by `10`. A percentage of `14` means `1.4%`   

## Known Weaknesses
* In overpaid transactions that require change, the TokenPurchase event will be emitted with the wrong value(but correct token amount).
* Keeping the changeDue variable in storage makes the purchase a bit more expensive gas-wise
