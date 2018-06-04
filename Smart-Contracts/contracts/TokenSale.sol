pragma solidity 0.4.24;

import 'openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol';
import './SolidifiedToken.sol';
import 'openzeppelin-solidity/contracts/lifecycle/Pausable.sol';

contract TokenSale is MintedCrowdsale, WhitelistedCrowdsale, Pausable {

  enum Stages{
    SETUP,
    READY,
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
  uint256 public presale_StartDate;
  uint256 public presale_EndDate;
  uint256 public presale_Cap;
  uint256 public presale_TokenCap;
  uint256 public presale_TokesSold;

  //PUBLICSALE VARIABLES
  uint256 public publicSale_StartDate;
  uint256 public publicSale_EndDate;
  uint256 public publicSale_Cap;
  uint256 public publicSale_TokenCap;
  uint256 public publicSale_TokesSold;


  //TEMP VARIABLE - USED TO NOT OVERRIDE MORE OZ FUNCTIONS
  uint256 changeDue;
  bool capReached;


  constructor(uint256 _rate, address _wallet, ERC20 _token, uint256 presaleTokenCap, uint256 publicSaleTokenCap) public Crowdsale(_rate,_wallet,_token) {
    presale_TokenCap = presaleTokenCap;
    publicSale_TokenCap = publicSaleTokenCap;
    presale_Cap = 19200 ether;
    publicSale_Cap = 12000 ether;
    minimumContribution = 0.5 ether;
    maximumContribution = 100 ether;
  }

  modifier atStage(Stages _currentStage){
    require(currentStage == _currentStage);
    _;
  }

  modifier timedTransition(){
    if(currentStage == Stages.READY && now >= presale_StartDate){
      currentStage = Stages.PRESALE;
    }
    if(currentStage == Stages.PRESALE && now > presale_EndDate){
      finalizePresale();
    }
    if(currentStage == Stages.BREAK && now > presale_EndDate + 10 days){
      currentStage = Stages.PUBLICSALE;
    }
    if(currentStage == Stages.PUBLICSALE && now > publicSale_EndDate){
      finalizeSale();
    }
    _;
  }

  function updateStage() timedTransition {
    //Satge Conversions not covered by times Transitions
    if(currentStage == Stages.PRESALE){
      require(presale_Cap.sub(presale_TokesSold) < minimumContribution);
      finalizePresale();
    }
    if(currentStage == Stages.PUBLICSALE){
      require(publicSale_Cap.sub(publicSale_TokesSold) < minimumContribution);
      currentStage = Stages.FINALAIZED;
    }
  }

  function setupSale(uint256 initialDate, address tokenAddress) onlyOwner atStage(Stages.SETUP) public {
    setUpToken(tokenAddress);
    setDates(initialDate);
    currentStage = Stages.READY;
  }

  /**
   * @dev Sets tha dates and durations of the different sale stages
   * @param _presaleSartDate A timestamp representing the start of the presale
   */
  function setDates(uint256 _presaleSartDate) onlyOwner atStage(Stages.SETUP) internal {
    presale_StartDate = _presaleSartDate;
    presale_EndDate = presale_StartDate + 90 days;
  }

  function setUpToken(address _token) onlyOwner atStage(Stages.SETUP) internal {
    token = ERC20(_token);
    require(SolidifiedToken(_token).owner() == address(this), "Issue with token setup");
  }

  /**
   * @dev Returns de ETH cap of the current currentStage
   * @return uint256 representing the cap
   */
  function getCurrentCap() public returns(uint256 cap){
    cap = presale_Cap;
    if(currentStage == Stages.PUBLICSALE){
      cap = publicSale_Cap;
    }
  }

  function saleOpen() public timedTransition returns(bool open) {
    /* if((now >= presale_StartDate && now <= presale_EndDate) ||
       (now >= publicSale_EndDate && now <= publicSale_EndDate)) {
         open = true;
    } */
    open = ((now >= presale_StartDate && now <= presale_EndDate) ||
           (now >= publicSale_EndDate && now <= publicSale_EndDate)) &&
           (currentStage == Stages.PRESALE || currentStage == Stages.PUBLICSALE);

    return open;
  }

  /* function distributeTokens(address[] beneficiaries, uint256[] amounts) public onlyOwner atStage(Stages.FINALAIZED) {
    for(uint i = 0; i < beneficiaries.length; i++){
      _deliverTokens(beneficiaries[i], amounts[i]);
    }
  } */

  function finalizePresale() atStage(Stages.PRESALE) public{
    presale_EndDate = now;
    publicSale_StartDate = presale_EndDate + 10 days;
    publicSale_EndDate = publicSale_StartDate + 30 days;
    publicSale_TokenCap = publicSale_TokenCap.add(presale_TokenCap.sub(presale_TokesSold));
    publicSale_Cap = publicSale_Cap.add(presale_Cap.sub(weiRaised).sub(changeDue));
    currentStage = Stages.BREAK;
  }

  function finalizeSale() public {
    // Mint tokens to founders and partnes
    //distributeTokens();
    // Enable token transfer
    // Finish token minting
    //require(MintableToken(token).finishMinting());
    // Set token timelock
  }


  //OVERRIDES

  /**
   * @dev Validation of an incoming purchase. Use require statements to revert state when conditions are not met. Use super to concatenate validations.
   * @param _beneficiary Address performing the token purchase
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) timedTransition isWhitelisted(_beneficiary) internal {
    require(saleOpen(), "Sale is Closed");
    //require(_weiAmount >= minimumContribution, "Contribution below minimum");

    // Check for edge cases
    uint256 acceptedValue = _weiAmount;
    if(contributions[msg.sender].add(acceptedValue) > maximumContribution){
      changeDue = contributions[msg.sender].add(acceptedValue).sub(maximumContribution);
      acceptedValue = acceptedValue.sub(changeDue);
    }
    uint256 currentCap = getCurrentCap();
    if(weiRaised.add(acceptedValue) > currentCap){
      changeDue = changeDue.add(weiRaised.add(acceptedValue).sub(currentCap));
      acceptedValue = _weiAmount.sub(changeDue);
      capReached = true;
    }
    require(acceptedValue >= minimumContribution, "Contribution below minimum");
  }

  /**
   * @dev Override to extend the way in which ether is converted to tokens.
   * @param _weiAmount Value in wei to be converted into tokens
   * @return Number of tokens that can be purchased with the specified _weiAmount
   */
  function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256 amount) {
    amount = (_weiAmount.sub(changeDue)).mul(1000).div(rate); // Multiplication to account for the decimal cases in the rate
    if(currentStage == Stages.PRESALE){
      amount = amount.add(amount.mul(25).div(100)); //Add bonus 
    }
  }

  /**
   * @dev Validation of an executed purchase. Observe state and use revert statements to undo rollback when valid conditions are not met.
   * @param _beneficiary Address performing the token purchase
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _postValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    uint256 tokenAmount = _getTokenAmount(_weiAmount);

    if(currentStage == Stages.PRESALE){
      presale_TokesSold = presale_TokesSold.add(tokenAmount);
      if(capReached)
        finalizePresale();
    } else{
      publicSale_TokesSold = publicSale_TokesSold.add(tokenAmount);
      if(capReached)
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

// 15, "0xca35b7d915458ef540ade6068dfe2f44e8fa733c", "0xbbf289d846208c16edc8474705c748aff07732db", "19200000000000000000000", "120000000000000000000"
