pragma solidity 0.4.24;

import 'openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol';
import './SolidToken.sol';
import './Distributable.sol';
import 'openzeppelin-solidity/contracts/lifecycle/Pausable.sol';

contract TokenSale is MintedCrowdsale, WhitelistedCrowdsale, Pausable, Distributable {

  //Global Variables
  mapping(address => uint) public contributions;
  Stages public currentStage;
  uint256 public minimumContribution;
  uint256 public maximumContribution;

  //PRESALE VARIABLES
  uint256 public presale_StartDate;
  uint256 public presale_EndDate;
  uint256 public presale_Cap;
  uint256 public presale_TokenCap;
  uint256 public presale_TokesSold;
  uint256 public presale_WeiRaised;

  //MAINSALE VARIABLES
  uint256 public mainSale_StartDate;
  uint256 public mainSale_EndDate;
  uint256 public mainSale_Cap;
  uint256 public mainSale_TokenCap;
  uint256 public mainSale_TokesSold;
  uint256 public mainSale_WeiRaised;


  //TEMPORARY VARIABLES - USED TO AVOID OVERRIDING MORE OPEN ZEPPELING FUNCTIONS
  uint256 changeDue;
  bool capReached;

  enum Stages{
    SETUP,
    READY,
    PRESALE,
    BREAK,
    MAINSALE,
    FINALAIZED
  }



  /**
      MODIFIERS
  **/

  /**
    @dev Garantee that contract has the desired satge
  **/
  modifier atStage(Stages _currentStage){
      require(currentStage == _currentStage);
      _;
  }
  /**
    @dev Execute automatically transitions between different Stages
    based on time only
  **/
  modifier timedTransition(){
    if(currentStage == Stages.READY && now >= presale_StartDate){
      currentStage = Stages.PRESALE;
    }
    if(currentStage == Stages.PRESALE && now > presale_EndDate){
      finalizePresale();
    }
    if(currentStage == Stages.BREAK && now > presale_EndDate + 10 days){
      currentStage = Stages.MAINSALE;
    }
    if(currentStage == Stages.MAINSALE && now > mainSale_EndDate){
      finalizeSale();
    }
    _;
  }


  /**
      CONSTRUCTOR
  **/

  /**
    @param _rate The exchange rate(multiplied by 1000) of tokens to eth(1 token = rate * ETH)
    @param _wallet The address that recieves _forwardFunds
    @param _token A token contract. Will be overriden later(needed fot OZ constructor)
    @param _presaleCap the ETH cap of the presale.
    @param _mainCap the ETH cap of the public sale.
  **/
  constructor(uint256 _rate, address _wallet, ERC20 _token, uint256 _presaleCap, uint256 _mainCap) public Crowdsale(_rate,_wallet,_token) {
    presale_TokenCap = _presaleCap.div(rate).mul(1250); // shorthand for (cap / rate * 1000) * 1.25
    mainSale_TokenCap = _mainCap.div(rate).mul(1000);
    presale_Cap = _presaleCap;
    mainSale_Cap = _mainCap;

    minimumContribution = 0.5 ether;
    maximumContribution = 100 ether;
  }


  /**
      SETUP RELATED FUNCTIONS
  **/

  /**
   * @dev Sets the initial date and token.
   * @param initialDate A timestamp representing the start of the presale
    @param tokenAddress  The address of the deployed SolidToken
   */
  function setupSale(uint256 initialDate, address tokenAddress) onlyOwner atStage(Stages.SETUP) public {
    presale_StartDate = initialDate;
    presale_EndDate = presale_StartDate + 90 days;
    token = ERC20(tokenAddress);
    require(SolidToken(tokenAddress).totalSupply() == 0, "Tokens have already been distributed");
    require(SolidToken(tokenAddress).owner() == address(this), "Token has the wrong ownership");
    currentStage = Stages.READY;
  }


  /**
      STAGE RELATED FUNCTIONS
  **/

  /**
    @dev Executes the timed transition and check for edge cases. Needed for when a stage transition makes
    the transaction fail.
  **/
  function updateStage() timedTransition {
    //Satge Conversions not covered by timed Transitions
    if(currentStage == Stages.PRESALE){
      if(presale_Cap.sub(weiRaised) < minimumContribution)
        finalizePresale();
    }
    if(currentStage == Stages.MAINSALE){
      if((mainSale_Cap.add(presale_Cap)).sub(weiRaised) < minimumContribution)
        currentStage = Stages.FINALAIZED;
    }
  }

  /**
   * @dev Returns de ETH cap of the current currentStage
   * @return uint256 representing the cap
   */
  function getCurrentCap() public  view returns(uint256 cap){
    cap = presale_Cap;
    if(currentStage == Stages.MAINSALE){
      cap = mainSale_Cap;
    }
  }

  /**
   * @dev Returns de ETH cap of the current currentStage
   * @return uint256 representing the raised amount in the stage
   */
  function getRaisedForCurrentStage() public view returns(uint256 raised){
    raised = presale_WeiRaised;
    if(currentStage == Stages.MAINSALE)
      raised = mainSale_WeiRaised;
  }

  /**
   * @dev Returns the sale status.
   * @return True if open, false if closed
   */
  function saleOpen() public timedTransition returns(bool open) {
    open = ((now >= presale_StartDate && now <= presale_EndDate) ||
           (now >= mainSale_StartDate && now <= mainSale_EndDate)) &&
           (currentStage == Stages.PRESALE || currentStage == Stages.MAINSALE);
  }



  /**
    FINALIZATION RELATES FUNCTIONS
  **/

  /**
   * @dev Checks and distribute the remaining tokens. Finish minting afterwards
   * @return uint256 representing the cap
   */
  function distributeTokens() public onlyOwner atStage(Stages.FINALAIZED) {
    require(!distributed);
    require(checkPercentages(40));//Magic number -> Only 60% will be sold, therefore all other % must be less than 40%
    uint256 totalTokens = (presale_TokesSold.add(mainSale_TokesSold)).mul(10).div(6);
    for(uint i = 0; i < partners.length; i++){
      uint256 amount = percentages[partners[i]].mul(totalTokens).div(1000);
      _deliverTokens(partners[i], amount);
    }
    require(SolidToken(token).finishMinting());
    distributed = true;
  }

  /**
   * @dev Finalizes the presale and sets up the break and public sales
   *
   */
  function finalizePresale() atStage(Stages.PRESALE) internal{
    presale_EndDate = now;
    mainSale_StartDate = presale_EndDate + 10 days;
    mainSale_EndDate = mainSale_StartDate + 30 days;
    mainSale_TokenCap = mainSale_TokenCap.add(presale_TokenCap.sub(presale_TokesSold));
    mainSale_Cap = mainSale_Cap.add(presale_Cap.sub(weiRaised.sub(changeDue)));
    currentStage = Stages.BREAK;
  }

  /**
   * @dev Finalizes the public sale
   *
   */
  function finalizeSale() atStage(Stages.MAINSALE) internal {
    mainSale_EndDate = now;
    require(SolidToken(token).setTransferEnablingDate(now + 182 days));
    currentStage = Stages.FINALAIZED;
  }


  /**
      OPEN ZEPPELIN OVERRIDES
  **/

  /**
   * @dev Validation of an incoming purchase. Use require statements to revert state when conditions are not met. Use super to concatenate validations.
   * @param _beneficiary Address performing the token purchase
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) isWhitelisted(_beneficiary) internal {
    require(saleOpen(), "Sale is Closed");

    // Check for edge cases
    uint256 acceptedValue = _weiAmount;
    if(contributions[_beneficiary].add(acceptedValue) > maximumContribution){
      changeDue = (contributions[_beneficiary].add(acceptedValue)).sub(maximumContribution);
      acceptedValue = acceptedValue.sub(changeDue);
    }
    uint256 currentCap = getCurrentCap();
    uint256 raised = getRaisedForCurrentStage();
    if(raised.add(acceptedValue) > currentCap){
      changeDue = changeDue.add(raised.add(acceptedValue).sub(currentCap));
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
      presale_WeiRaised = presale_WeiRaised.add(_weiAmount.sub(changeDue));
      if(capReached)
        finalizePresale();
    } else{
      mainSale_TokesSold = mainSale_TokesSold.add(tokenAmount);
      mainSale_WeiRaised = mainSale_WeiRaised.add(_weiAmount.sub(changeDue));
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
    contributions[_beneficiary] = contributions[_beneficiary].add(_weiAmount).sub(changeDue);
  }

  /**
   * @dev Determines how ETH is stored/forwarded on purchases.
   */
  function _forwardFunds() internal {
    wallet.transfer(msg.value.sub(changeDue));
  }

}
