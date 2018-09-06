pragma solidity 0.4.24;

import "openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol";
import "openzeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";
import "./SolidToken.sol";
import "./Distributable.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";

contract TokenSale is MintedCrowdsale, WhitelistedCrowdsale, Pausable, Distributable {

  //Global Variables
  mapping(address => uint256) public contributions;
  Stages public currentStage;

  //CONSTANTS
  uint256 constant MINIMUM_CONTRIBUTION = 0.5 ether;  //the minimum conbtribution on Wei
  uint256 constant MAXIMUM_CONTRIBUTION = 100 ether;  //the maximum contribution on Wei
  uint256 constant SALE_DURATION = 30 days;
  uint256 constant HUNDRED_PERCENT = 1000;            //100% considering one extra decimal
  uint256 constant TOKEN_CAP = 800000 ether;
  uint256 constant WEEK_1_BONUS_PERCENT = 250;
  uint256 constant WEEK_2_BONUS_PERCENT = 150;
  uint256 constant WEEK_3_BONUS_PERCENT = 50;

  // Sale related variables
  uint256 public startDate;
  uint256 public endDate;
  uint256 public tokensSold;


  //TEMPORARY VARIABLES - USED TO AVOID OVERRIDING MORE OPEN ZEPPELING FUNCTIONS
  uint256 private changeDue;
  bool private capReached;

  enum Stages{
    SETUP,
    READY,
    SALE,
    FINALIZED
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
    if(currentStage == Stages.READY && now >= startDate){
      currentStage = Stages.SALE;
    }

    if(currentStage == Stages.SALE && now > endDate){
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
  **/
  constructor(uint256 _rate, address _wallet, ERC20 _token) public Crowdsale(_rate,_wallet,_token) {
    require(_rate == 15);
    currentStage = Stages.SETUP;
  }


  /**
      SETUP RELATED FUNCTIONS
  **/

  /**
   * @dev Sets the initial date and token.
   * @param initialDate A timestamp representing the start of the bonussale
    @param tokenAddress  The address of the deployed SolidToken
   */
  function setupSale(uint256 initialDate, address tokenAddress) onlyOwner atStage(Stages.SETUP) public {
    startDate = initialDate;
    endDate = startDate + SALE_DURATION;
    token = ERC20(tokenAddress);

    //require(SolidToken(tokenAddress).totalSupply() == 0, "Tokens have already been distributed");
    require(SolidToken(tokenAddress).owner() == address(this), "Token has the wrong ownership");

    currentStage = Stages.READY;
  }


  /**
      STAGE RELATED FUNCTIONS
  **/

  /**
   * @dev Returns de ETH cap of the current currentStage
   * @return uint256 representing the cap
   */
  function getBonusPercent() public view returns(uint256 bonus){
    uint week = (now - startDate) / 1 weeks + 1;
    bonus = 0;
    if(week == 1) bonus = WEEK_1_BONUS_PERCENT;
    if(week == 2) bonus = WEEK_2_BONUS_PERCENT;
    if(week == 3) bonus = WEEK_3_BONUS_PERCENT;
  }

  /**
   * @dev Returns the sale status.
   * @return True if open, false if closed
   */
  function saleOpen() public timedTransition whenNotPaused returns(bool open) {
    open = (now >= startDate && now < endDate) && currentStage == Stages.SALE;
  }


  /**
   * @dev Finalizes the public sale
   *
   */
  function finalizeSale() atStage(Stages.SALE) internal {
    endDate = now;
    currentStage = Stages.FINALIZED;
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
    require(_beneficiary == msg.sender);
    require(saleOpen(), "Sale is Closed");

    // Check for edge cases
    uint256 acceptedValue = _weiAmount;
    if(contributions[_beneficiary].add(acceptedValue) > MAXIMUM_CONTRIBUTION){
      changeDue = (contributions[_beneficiary].add(acceptedValue)).sub(MAXIMUM_CONTRIBUTION);
      acceptedValue = acceptedValue.sub(changeDue);
    }

    uint256 tokens = _getTokenAmount(_weiAmount);
    if(tokensSold.add(tokens) >= TOKEN_CAP){
      changeDue = _getWeiAmount(tokens.sub(TOKEN_CAP.sub(tokensSold)));
      acceptedValue = _weiAmount.sub(changeDue);
      capReached = true;
    }

    require(capReached || contributions[_beneficiary].add(acceptedValue) >= MINIMUM_CONTRIBUTION ,"Contribution below minimum");
  }

  /**
   * @dev Override to extend the way in which ether is converted to tokens.
   * @param _tokens Value in wei to be converted into tokens
   * @return Number of tokens that can be purchased with the specified _weiAmount
   */
  function _getWeiAmount(uint256 _tokens) internal view returns (uint256 amount) {
    uint bonus = getBonusPercent();
    amount = _tokens.mul(rate).div(HUNDRED_PERCENT.add(bonus));
  }

  /**
   * @dev Override to extend the way in which ether is converted to tokens.
   * @param _weiAmount Value in wei to be converted into tokens
   * @return Number of tokens that can be purchased with the specified _weiAmount
   */
  function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256 amount) {
    amount = (_weiAmount.sub(changeDue)).mul(HUNDRED_PERCENT).div(rate); // Multiplication to account for the decimal cases in the rate
    uint bonus = getBonusPercent();
    amount = amount.add(amount.mul(bonus).div(HUNDRED_PERCENT));
  }

  /**
   * @dev Validation of an executed purchase. Observe state and use revert statements to undo rollback when valid conditions are not met.
   * @param _beneficiary Address performing the token purchase
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _postValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    if(currentStage == Stages.SALE && capReached) finalizeSale();

    //Cleanup temp
    changeDue = 0;
    capReached = false;

  }

  /**
   * @dev Override for extensions that require an internal state to check for validity (current user contributions, etc.)
   * @param _beneficiary Address receiving the tokens
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _updatePurchasingState(address _beneficiary, uint256 _weiAmount) internal {
    uint256 tokenAmount = _getTokenAmount(_weiAmount.sub(changeDue));
    tokensSold = tokensSold.add(tokenAmount);
    weiRaised = weiRaised.sub(changeDue);
    contributions[_beneficiary] = contributions[_beneficiary].add(_weiAmount).sub(changeDue);
  }

  /**
   * @dev Determines how ETH is stored/forwarded on purchases.
   */
  function _forwardFunds() internal {
    wallet.transfer(msg.value.sub(changeDue));
    msg.sender.transfer(changeDue); //Transfer change to _beneficiary
  }

}
