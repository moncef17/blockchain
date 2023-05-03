function Reputation(){
    this.reputationScore = 0.2;
    this.BlocksMined = 0;
    //this.TransactionsProcessed = 0;
    this.consensusParticipation = 0;
    this.weightBlocksMined = 0.05;
    this.weightconsensusParticipation = 0.04;
    //this.weightTransactionsProcessed = 0.3;
    
    this.reputationList = [];
    
};
Reputation.prototype.voteWeight = function(totalNetworkReputation) {
    let weight = 0;
    weight = this.reputationScore / totalNetworkReputation;
    return weight;
};
Reputation.prototype.calculateReputationScore = function(reputationScore, totalNetworkReputation, BlocksMined, consensusParticipation) {
    const result = ((BlocksMined * this.weightBlocksMined) +
                 (consensusParticipation * this.weightconsensusParticipation)) / totalNetworkReputation;
    let newReputationScore = reputationScore + result;
    return newReputationScore;
};

module.exports = Reputation;


