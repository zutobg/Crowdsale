currentStagepragma solidity 0.4.24;

import 'openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol';

contract TokenSale is MintedCrowdsale {

  enum Stages{
    SETUP,
    PRESALE,
    BREAK,
    PUBLICSALE,
    FINALAIZED
  }

  //Global Variables
  mapping(address => uint) contributions;
  Stages public currentStage;
  uint256 public minimumContribution;
  uint256 public maximumContribution;

  //PRESALE VARIABLES
  uint256 presale_StartDate;
  uint256 presale_EndDate;
  uint256 presaleCap;
  uint256 presale_TokesSold;

  //PUBLICSALE VARIABLES
  uint256 publicSale_StartDate;
  uint256 publicSale_EndDate;
  uint256 publicSaleCap;
  uint256 publicSale_TokesSold;


  //TEMP VARIABLE - USED TO NOT OVERRIDE MORE OZ FUNCTIONS
  uint256 changeDue;
  bool capReached;


  constructor(uint256 _rate, address _wallet, ERC20 _token, uint256 PresaleCap, uint256 PublicSaleCap) Crowdsale(_rate,_wallet,_token) {
    //DEPLY TOKEN
  }


  modifier atStage(Stages _currentStage){
    require(currentStage == _currentStage);
    _;
  }

  modifier timedTransition(){
    if(currentStage == Stages.PRESALE && now > presale_EndDate){
      currentStage = Stages.PUBLICSALE;
    }
    if(currentStage == Stages.PUBLICSALE && now > publicSale_EndDate){
      currentStage = Stages.FINALAIZED;
    }
    _;
  }

  /**
   * @dev Returns de ETH cap of the current currentStage
   * @return uint256 representing the cap
   */
  function getCurrentCap() public returns(uint256 cap){
    cap = presaleCap;
    if(currentStage == Stages.PUBLICSALE){
      cap = publicSaleCap;
    }
  }

  function saleOpen() public returns(bool open){
    /* if((now >= presale_StartDate && now <= presale_EndDate) ||
       (now >= publicSale_EndDate && now <= publicSale_EndDate)) {
         open = true;
    } */
    open = ((now >= presale_StartDate && now <= presale_EndDate) ||
           (now >= publicSale_EndDate && now <= publicSale_EndDate)) &&
           (currentStage == Stages.PRESALE || currentStage == Stages.PUBLICSALE);
  }

  function moveToPublicSale() atStage(Stages.BREAK) public{
    currentStage = Stages.PUBLICSALE;
  }

  function finalizeSale() public {
    // Mint tokens to founders and partnes
    // Enable token transfer
    // Finish token minting
    // Token ownership?
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
    uint256 acceptedValue = _weiAmount;
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
    if(currentStage == Stages.PRESALE){
      amount = amount.add(amount.mul(20).div(100));
    }
  }

  /**
   * @dev Validation of an executed purchase. Observe state and use revert statements to undo rollback when valid conditions are not met.
   * @param _beneficiary Address performing the token purchase
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _postValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    if(capReached && currentStage == Stages.PRESALE){
      //moveToPublicSale(); //MoveToBreak
    } else if(capReached && stage == Stages.PUBLICSALE){
      finalizeSale();
    }
    //Triggers for reaching cap
    weiRaised = weiRaised.sub(changeDue);
    uint256 change = changeDue;
    changeDue = 0;
    capReached = false;
    _beneficiary.transfer(change);
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
