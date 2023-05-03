function Consensus(){
    this.consensusGroup = [];
    this.leader = null;
    this.leaderList = [];
    

};
Consensus.prototype.setConsensusGroup = function(sumOfVotedForReputation, totalNetworkReputation, votedForNodes){
    
    if(sumOfVotedForReputation > (totalNetworkReputation * 0.5)){
       return votedForNodes;
    }
    else{
        return [{note: "Consensus group not reached, group reputation < 50% of the total netwrok reputation."}];
    }
};

Consensus.prototype.random = function(consensusGroup){
    const randomIndex = Math.floor(Math.random() * consensusGroup.length);

    return consensusGroup[randomIndex];
}
module.exports = Consensus;
