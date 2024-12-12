// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

contract MoviePoll{
    
   
    enum PollStatus { NotStarted, Voting, Ended }

  
    struct Poll {
        mapping(string => uint) votes;
        mapping(string => bool) validMovies;
        mapping(address => string) userVotes;
        string[] movies;
        uint endTime;
        PollStatus status;
        string winner;
    }

    Poll public currentPoll;
    address public owner;

   
    event VotingStarted(uint endTime);
    event VoteCast(address voter, string movie);
    event VoteChanged(address voter, string oldMovie, string newMovie);
    event VotingEnded(string winner);

    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    
    modifier pollActive() {
        require(currentPoll.status == PollStatus.Voting, "Voting is not open");
        require(block.timestamp <= currentPoll.endTime, "Voting period has ended");
        _;
    }


    constructor() {
        owner = msg.sender;
    }

  
function startPoll(string[] memory _movies, uint _durationInMinutes) public onlyOwner {
    require(_movies.length > 0, "Movies list cannot be empty");
    require(_durationInMinutes > 0, "Duration must be greater than zero");
    require(currentPoll.status != PollStatus.Voting, "A poll is already active");

    delete currentPoll; 
    for (uint i = 0; i < _movies.length; i++) {
        currentPoll.validMovies[_movies[i]] = true;
    }
    currentPoll.movies = _movies;
    currentPoll.endTime = block.timestamp + (_durationInMinutes * 1 minutes);
    currentPoll.status = PollStatus.Voting;

    emit VotingStarted(currentPoll.endTime);
}

     function getPollStatus() public view returns (PollStatus) {
        return currentPoll.status;
    }   


    function vote(string memory _movie) public pollActive {
        require(currentPoll.validMovies[_movie], "The selected movie is not in the poll");
        require(bytes(currentPoll.userVotes[msg.sender]).length == 0, "You have already voted");

        
        currentPoll.userVotes[msg.sender] = _movie;
        currentPoll.votes[_movie]++;

        emit VoteCast(msg.sender, _movie);
    }

    function getVotes(string memory _movie) public view returns (uint) {
        return currentPoll.votes[_movie];
    }



function getMovies() public view returns (string[] memory) {
    return currentPoll.movies;
}

function getRemainingTime() public view returns (uint) {
    if (currentPoll.status != PollStatus.Voting || block.timestamp >= currentPoll.endTime) {
        return 0;
    }
    return currentPoll.endTime - block.timestamp;
}

  
    function revote(string memory _newMovie) public pollActive {
        require(currentPoll.validMovies[_newMovie], "The selected movie is not in the poll");
        require(bytes(currentPoll.userVotes[msg.sender]).length > 0, "You have not voted yet");

      
        string memory previousVote = currentPoll.userVotes[msg.sender];
        if (keccak256(abi.encodePacked(previousVote)) != keccak256(abi.encodePacked(_newMovie))) {
            currentPoll.votes[previousVote]--;  
            currentPoll.votes[_newMovie]++;     
            currentPoll.userVotes[msg.sender] = _newMovie;
            emit VoteChanged(msg.sender, previousVote, _newMovie);
        }
    }

 
    function endPoll() public onlyOwner {
        require(currentPoll.status == PollStatus.Voting, "Voting is not in progress");
        require(block.timestamp > currentPoll.endTime, "Voting period is still active");

        currentPoll.status = PollStatus.Ended;

      
        uint maxVotes = 0;
        string[] memory winningMovies = new string[](currentPoll.movies.length);
        uint winningCount = 0;

        // Find max votes
        for (uint i = 0; i < currentPoll.movies.length; i++) {
            string memory movie = currentPoll.movies[i];
            uint movieVotes = currentPoll.votes[movie];
            if (movieVotes > maxVotes) {
                maxVotes = movieVotes;
                winningCount = 1;
                winningMovies[0] = movie;
            } else if (movieVotes == maxVotes) {
                winningMovies[winningCount] = movie;
                winningCount++;
            }
        }

        // In case of a tie, select the first movie
        currentPoll.winner = winningMovies[0];
        emit VotingEnded(currentPoll.winner);
    }

    
    function getWinner() public view returns (string memory) {
        require(currentPoll.status == PollStatus.Ended, "Voting has not ended yet");
        return currentPoll.winner;
    }

    function hasVoted(address _voter) public view returns (bool) {
        return bytes(currentPoll.userVotes[_voter]).length > 0;
    }
}



