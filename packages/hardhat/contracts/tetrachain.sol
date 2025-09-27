// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";


contract tetrachain is Ownable, ReentrancyGuard {
    struct PlayerScore {
        address player;
        uint256 score;
        uint256 timestamp;
    }

    // Mapping to store the highest score for each player
    mapping(address => uint256) public highestScores;
    
    // Track claimed rewards to prevent double claiming
    mapping(address => mapping(uint256 => bool)) public rewardsClaimed;
    
    // Event to log when a new score is submitted
    event ScoreSubmitted(address indexed player, uint256 score, uint256 timestamp);
    event RewardClaimed(address indexed player, uint256 score, uint256 reward);

    // Array to store all submitted scores (for leaderboard)
    PlayerScore[] public leaderboard;

    // Basic reward mechanism
    uint256 public constant REWARD_PER_SCORE_POINT = 1 ether / 100000; // 0.00001 ETH per score point
    uint256 public constant MIN_SCORE_FOR_REWARD = 100;
    uint256 public constant MAX_REWARD_PER_CLAIM = 1 ether; // Cap rewards to prevent drainage

    constructor() Ownable(msg.sender) {}

    // Function to submit a new score
    function submitScore(uint256 _score) public {
        require(_score > 0, "Score must be positive");
        require(_score <= 999999, "Score too high"); // Reasonable upper limit

        // Only update if current score is higher than previous highest score for this player
        if (_score > highestScores[msg.sender]) {
            highestScores[msg.sender] = _score;
        }

        leaderboard.push(PlayerScore(msg.sender, _score, block.timestamp));
        emit ScoreSubmitted(msg.sender, _score, block.timestamp);
    }

    // Function to get the current leaderboard (basic, could be optimized for large data)
    function getLeaderboard() public view returns (PlayerScore[] memory) {
        return leaderboard;
    }

    // Function to get leaderboard with pagination to handle large datasets
    function getLeaderboardPaginated(uint256 _start, uint256 _limit) 
        public 
        view 
        returns (PlayerScore[] memory) 
    {
        require(_start < leaderboard.length, "Start index out of bounds");
        
        uint256 end = _start + _limit;
        if (end > leaderboard.length) {
            end = leaderboard.length;
        }
        
        PlayerScore[] memory result = new PlayerScore[](end - _start);
        for (uint256 i = _start; i < end; i++) {
            result[i - _start] = leaderboard[i];
        }
        
        return result;
    }

    // Function to calculate and claim rewards (fixed)
    function claimReward(uint256 _score) public nonReentrant {
        require(_score >= MIN_SCORE_FOR_REWARD, "Score too low for reward");
        require(_score <= highestScores[msg.sender], "Cannot claim reward for score higher than your best");
        require(!rewardsClaimed[msg.sender][_score], "Reward already claimed for this score");
        
        // Calculate reward amount with cap
        uint256 rewardAmount = _score * REWARD_PER_SCORE_POINT;
        if (rewardAmount > MAX_REWARD_PER_CLAIM) {
            rewardAmount = MAX_REWARD_PER_CLAIM;
        }
        
        require(address(this).balance >= rewardAmount, "Contract has insufficient funds");

        // Mark reward as claimed
        rewardsClaimed[msg.sender][_score] = true;

        // Transfer reward
        (bool success, ) = payable(msg.sender).call{value: rewardAmount}("");
        require(success, "Failed to send reward");
        
        emit RewardClaimed(msg.sender, _score, rewardAmount);
    }

    // Owner can deposit ETH into the contract for rewards
    function deposit() public payable onlyOwner {}

    // Owner can withdraw ETH from the contract (emergency/admin)
    function withdraw(uint256 _amount) public onlyOwner {
        require(address(this).balance >= _amount, "Insufficient balance");
        (bool success, ) = payable(owner()).call{value: _amount}("");
        require(success, "Failed to withdraw");
    }

    // Get contract balance
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // Get total number of scores submitted
    function getTotalScores() public view returns (uint256) {
        return leaderboard.length;
    }

    // Check if a reward has been claimed
    function hasClaimedReward(address _player, uint256 _score) public view returns (bool) {
        return rewardsClaimed[_player][_score];
    }
}