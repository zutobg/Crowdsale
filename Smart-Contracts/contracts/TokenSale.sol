pragma solidity 0.4.24;

import 'openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol';

contract TokenSale is MintedCrowdsale {

  enum Stages{
    Setup,
    Presale,
    PublicSale,
    Finalized
  }

  //Global Variables
  mapping(address => uint) contributions;
  Stages public stage;
  uint public minimumContribution;
  uint public maximumContribution;

  //PRESALE VARIABLES
  uint presalestartDate;
  uint presaleendDate;
  uint presaleCap;
  uint presaletokesSold;

  //PUBLICSALE VARIABLES
  uint mainSalestartDate;
  uint mainSaleendDate;
  uint publicSaleCap;
  uint maintokesSold;


  //TEMP VARIABLE - USED TO NOT OVERRIDE MORE OZ FUNCTIONS
  uint changeDue;
  bool capReached;


  constructor(uint256 _rate, address _wallet, address _token, uint PresaleCap, uint PublicSaleCap) Crowdsale(_rate,_wallet,_token) {
    
  }


  modifier atStage(Stages _stage){
    require(stage == _stage);
    _;
  }

  modifier timedTransition(){
    if(stage = Stages.Presale && now > presaleendDate){
      stage = Stages.PublicSale;
    }
    if(stage = Stages.PublicSale && now > mainSaleendDate){
      stage = Stages.Finalized;
    }
    _;
  }

  /**
   * @dev Returns de ETH cap of the current stage
   * @returns uint representing the cap
   */
  function getCurrentCap() public returns(uint256 cap){
    cap = presaleCap;
    if(stage == Stages.PublicSale){
      cap = publicSaleCap;
    }
  }

  function saleOpen() public returns(bool open){
    /* if((now >= presalestartDate && now <= presaleendDate) ||
       (now >= mainSaleendDate && now <= mainSaleendDate)) {
         open = true;
    } */
    open = ((now >= presalestartDate && now <= presaleendDate) ||
           (now >= mainSaleendDate && now <= mainSaleendDate)) &&
           (stage == Stages.Presale || stage == stages.PublicSale);
  }

  function moveToPublicSale() public{
    stage = Stages.PublicSale;
  }

  function finalizeSale() public {

  }


  //OVERRIDES

  /**
   * @dev Validation of an incoming purchase. Use require statements to revert state when conditions are not met. Use super to concatenate validations.
   * @param _beneficiary Address performing the token purchase
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) timedTransition internal {
    //require(_beneficiary != address(0)); - CHECK FOR WHITELIST INSTEAD

    require(saleOpen(), "Sale is Closed");
    require(_weiAmount >= minimumContribution, "Contribution below minimum");

    // Check for edge cases
    uint acceptedValue = _weiAmount;
    if(contributions[msg.sender].add(acceptedValue) > maximumContribution){
      changeDue = contributions[msg.sender].add(acceptedValue).sub(maximumContribution);
      acceptedValue = acceptedValue.sub(changeDue);
    }
    uint256 currentCap = getCurrentCap();
    if(weiRaised.add(acceptedValue) > currentCap){
      changeDue = changeDue.add(weiRaised.add(acceptedValue).sub(currentCap));
      capReached = true;
    }
  }

  /**
   * @dev Override to extend the way in which ether is converted to tokens.
   * @param _weiAmount Value in wei to be converted into tokens
   * @return Number of tokens that can be purchased with the specified _weiAmount
   */
  function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256 amount) {
    amount = (_weiAmount.sub(changeDue)).mul(rate);
    if(stage == Stages.Presale){
      amount = amount.add(amount.mul(20).div(100));
    }
  }

  /**
   * @dev Validation of an executed purchase. Observe state and use revert statements to undo rollback when valid conditions are not met.
   * @param _beneficiary Address performing the token purchase
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _postValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    if(capReached && stage == Stages.Presale){
      moveToPublicSale();
    } else if(capReached && stage == Stages.PublicSale){
      //finalize sale
    }
    //Triggers for reaching cap
    weiRaised = weiRaised.sub(changeDue);
    _beneficiary.transfer(changeDue);
    changeDue = 0; //TODO check for reentrancy
    capReached = false;
  }

  /**
   * @dev Override for extensions that require an internal state to check for validity (current user contributions, etc.)
   * @param _beneficiary Address receiving the tokens
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _updatePurchasingState(address _beneficiary, uint256 _weiAmount) internal {
    contributions[_beneficiary] = contributions[_beneficiary].add(_weiAmount.sub(changeDue));
  }


}
