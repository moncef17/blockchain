const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const Reputation = require('./nodeReputation');
const uuid = require('uuid/v1');
const port = process.argv[2];
const rp = require('request-promise');
const { json } = require('body-parser');
const Consensus = require('./consensus');
const nodeAddress = uuid().split('-').join('');
const copyrightChain = new Blockchain();
const reputation = new Reputation();
const consensus = new Consensus();
let nodesVotes = [];
const groupConsensus = [];
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));

app.get('/blockchain', function (req, res) {
  res.send(copyrightChain);
});

app.post('/transaction', function (req, res) {
    const newTransaction = req.body;
    const blockIndex = copyrightChain.addTransactionToPendingTrasactions(newTransaction);
    res.json({note: `Transaction will be added in block ${blockIndex}.`});
});
app.post('/data', function (req, res) {
  const newData = req.body;
  const blockIndex = copyrightChain.addDataToPendingDatas(newData);
  res.json({note: `Data will be added in block ${blockIndex}.`});
});

app.post('/transaction/broadcast',function(req, res){
  const newTransaction = copyrightChain.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
  copyrightChain.addTransactionToPendingTrasactions(newTransaction);
  const requestPromises = [];
  copyrightChain.networkNodes.forEach(networkNodeUrl => {
      const requestOptions = {
        uri: networkNodeUrl + '/transaction',
        method: 'POST',
        body: newTransaction,
        json: true
      };
      requestPromises.push(rp(requestOptions));
  });
    Promise.all(requestPromises)
    .then(data => {
        res.json({note: 'Transaction created and broadcast succesfully.'});
    });
});

app.post('/data/broadcast',function(req, res){
  const newData = copyrightChain.createNewData(req.body.title, req.body.author, req.body.content, req.body.date);
  copyrightChain.addDataToPendingDatas(newData);
  const requestPromises = [];
  copyrightChain.networkNodes.forEach(networkNodeUrl => {
      const requestOptions = {
        uri: networkNodeUrl + '/data',
        method: 'POST',
        body: newData,
        json: true
      };
      requestPromises.push(rp(requestOptions));
  });
    Promise.all(requestPromises)
    .then(data => {
        res.json({note: 'Data created and broadcast succesfully.'});
    });
});

app.get('/mine', function (req, res) {
  const requestPromises = [];
  copyrightChain.networkNodes.forEach(networkNodeUrl => {
    const requestOptions = {
      uri: networkNodeUrl + '/leader',
      method: 'GET',
      json: true
    };
    requestPromises.push(rp(requestOptions));
  });

  Promise.all(requestPromises)
  .then(data => {
    const leader = consensus.leader;
    if(copyrightChain.currentNodeUrl == leader) {
      const lastBlock = copyrightChain.getLastBlock();
      const previousBlockHash = lastBlock['hash'];
      const currentBlockData = {
        transactions: copyrightChain.pendingTransactions,
        datas: copyrightChain.pendingDatas,
        index: lastBlock['index'] + 1
      };
      const nonce = copyrightChain.proofOfWork(previousBlockHash, currentBlockData);
      const blockHash = copyrightChain.hashBlock(previousBlockHash, currentBlockData, nonce);
      const newBlock = copyrightChain.createNewBlock(nonce, previousBlockHash, blockHash);
      
      const requestPromises = [];
      copyrightChain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
          uri: networkNodeUrl + '/receive-new-block',
          method: 'POST',
          body: { newBlock: newBlock },
          json: true
        };
        requestPromises.push(rp(requestOptions));
      });
    
      Promise.all(requestPromises)
      .then(data => {
        const requestOptions = {
          uri: copyrightChain.currentNodeUrl + '/transaction/broadcast',
          method: 'POST',
          body: {
            amount: 12.5,
            sender: "00",
            recipient: nodeAddress
          },
          json: true
        };
        
        return rp(requestOptions);
      })
      .then(data => {
        reputation.BlocksMined = reputation.BlocksMined + 1;
          res.json({
            note: "New block mined & broadcast succesfully",
            block: newBlock
          });

          consensus.consensusGroup = [];
          nodesVotes = [];
          consensus.leader = '';
          consensus.leaderList.length = [];
          const requestPromises = [];
          copyrightChain.networkNodes.forEach(networkNodeUrl => {
          const requestOptions = {
          uri: networkNodeUrl + '/consensus-group',
          method: 'GET',
          json: true
        };
        requestPromises.push(rp(requestOptions));
      });
    
      Promise.all(requestPromises)
      }).then(data => {
          consensus.leader = '';
          consensus.leaderList.length = [];
          const requestPromises = [];
          copyrightChain.networkNodes.forEach(networkNodeUrl => {
          const requestOptions = {
          uri: networkNodeUrl + '/leader',
          method: 'GET',
          json: true
        };
        requestPromises.push(rp(requestOptions));
      });
      })
      .then(data => {
        const requestPromises = [];
        copyrightChain.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
        uri: networkNodeUrl + '/reset-consensus-session',
        method: 'POST',
        json: true
      };
      requestPromises.push(rp(requestOptions));
    });
  
    Promise.all(requestPromises)
      }).then(data => {
      
        let allNetworkNodes = [ ...copyrightChain.networkNodes, copyrightChain.currentNodeUrl];
        allNetworkNodes.forEach(networkNodeUrl => {
          const requestOptions = {
          uri: networkNodeUrl + '/reputation-update',
          method: 'GET',
          json: true
        };
        requestPromises.push(rp(requestOptions));
      });
    
      Promise.all(requestPromises);
        });
        
      
    }else{
      
        res.status(500).send({ error: 'An error occurred while getting consensus explorer data' });
      
    }
  });
  
  
});

app.post('/reset-consensus-session', function(req, res){
  consensus.consensusGroup = [];
  nodesVotes = [];
  consensus.leaderList.length = [];
  consensus.leader = '';
  res.json({note: "reset succesfully"});
});
app.post('/receive-new-block', function(req, res){
  const newBlock = req.body.newBlock;
  const lastBlock = copyrightChain.getLastBlock();
  const correctHash = lastBlock.hash === newBlock.previousBlockHash;
  const correctIndex = lastBlock['index'] + 1 === newBlock['index'];
  if(correctHash && correctIndex){
    copyrightChain.chain.push(newBlock);
    copyrightChain.pendingTransactions = [];
    copyrightChain.pendingDatas = [];
    res.json({
          note: 'New blockk received and accepted.',
          newBlock: newBlock
    });
  } else{
        res.json({
          note: 'New block rejected.',
          newBlock: newBlock
        });
  }

});

// register a node and broadcast it the network
app.post('/register-and-broadcast-node', function(req, res) {
  const newNodeUrl = req.body.newNodeUrl;
  const regNodesPromises = [];
  if (copyrightChain.networkNodes.indexOf(newNodeUrl) == -1) copyrightChain.networkNodes.push(newNodeUrl);

  copyrightChain.networkNodes.forEach(networkNodeUrl => {
    
    const requestOptions = {
      uri: networkNodeUrl + '/register-node',
      method: 'POST',
      body: { newNodeUrl: newNodeUrl },
      json: true
    };
  regNodesPromises.push(rp(requestOptions));
  });

  Promise.all(regNodesPromises)
  .then(data => {
    const bulkRegisterOptions = {
      uri: newNodeUrl + '/register-nodes-bulk',
      method: 'POST',
      body: { allNetworkNodes: [ ...copyrightChain.networkNodes, copyrightChain.currentNodeUrl] },
      json: true
    };
    return rp(bulkRegisterOptions)
    .then(data => {
      res.json({ note: 'New node registered with network succesfully.'});
    });
  }).then(data => {
            const currentNodeUrl = copyrightChain.currentNodeUrl;
          // Add the node URL and reputation rank to the reputation list
          if (!reputation.reputationList.some(node => node.node === currentNodeUrl)){
            reputation.reputationList.push({
            node: copyrightChain.currentNodeUrl,
            reputation: reputation.reputationScore
          });}
            const requestPromises = [];
            copyrightChain.networkNodes.forEach(nodeUrl => {
              const requestOptions = {
                uri: nodeUrl + '/add-node-reputation',
                method: 'POST',
                body: { node: currentNodeUrl ,
                        reputation: reputation.reputationScore
                    },
                json: true
            };
              requestPromises.push(rp(requestOptions));
          });
          Promise.all(requestPromises);
        
  }).then(data => {
    const requestPromises = [];
    const allNetworkNodes = [ ...copyrightChain.networkNodes, copyrightChain.currentNodeUrl];
    allNetworkNodes.forEach(nodeUrl => {
      const requestOptions = {
        uri: nodeUrl + '/add-node-reputation',
        method: 'POST',
        body: { node: newNodeUrl ,
                reputation: reputation.reputationScore
            },
        json: true
    };
      requestPromises.push(rp(requestOptions));
  });
  Promise.all(requestPromises)
  .then(data =>{
    const bulkRegisterOptions = {
      uri: newNodeUrl + '/register-reputation-bulk',
      method: 'POST',
      body: { allNetworkNodesReputations: reputation.reputationList },
      json: true
    };
    return rp(bulkRegisterOptions);
  });
  });
      
});

// register a node with the network
app.post('/register-node', function(req,res) {
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent = copyrightChain.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNodeUrl = copyrightChain.currentNodeUrl !== newNodeUrl;
    if(nodeNotAlreadyPresent  && notCurrentNodeUrl) copyrightChain.networkNodes.push(newNodeUrl);
    res.json({ note: 'New node registered succesfully.'});
});

// register multiple nodes at once
app.post('/register-nodes-bulk', function(req, res) {
  const allNetworkNodes = req.body.allNetworkNodes;
  allNetworkNodes.forEach(networkNodeUrl => {
    const nodeNotAlreadyPresent = copyrightChain.networkNodes.indexOf(networkNodeUrl) == -1;
    const notCurrentNode = copyrightChain.currentNodeUrl !== networkNodeUrl;
    if(nodeNotAlreadyPresent && notCurrentNode) copyrightChain.networkNodes.push(networkNodeUrl);
  });
    res.json({ note: 'Bulk registration successful.'})
});

app.get('/consensus', function(req, res){
  const requestPromises = [];
  copyrightChain.networkNodes.forEach(networkNodeUrl =>{
    const requestOptions = {
        uri: networkNodeUrl + '/blockchain',
        method: 'GET',
        json: true
    }; 
    requestPromises.push(rp(requestOptions));
  });
  Promise.all(requestPromises)
  .then(blockchains => {
    const currentChainLength = copyrightChain.chain.length;
    let maxChainLength = currentChainLength;
    let newLongestChain = null;
    let newPendingTransactions = null;
    let newPendingDatas = null;

    blockchains.forEach(blockchain => {
        if (blockchain.chain.length > maxChainLength) {
            maxChainLength = blockchain.chain.length;
            newLongestChain = blockchain.chain;
            newPendingTransactions = blockchain.pendingTransactions;
            newPendingDatas = blockchain.pendingDatas;
        };
    });

    if(!newLongestChain || (newLongestChain && !copyrightChain.chainIsValid(newLongestChain))){
        res.json({
          note: 'Current chain has not been replaced',
          chain: copyrightChain.chain
        });
    }
    else if (newLongestChain && copyrightChain.chainIsValid(newLongestChain)){
        copyrightChain.chain = newLongestChain;
        copyrightChain.pendingTransactions = newPendingTransactions;
        copyrightChain.pendingDatas = newPendingDatas;
        res.json({
          note: 'This chain has been replaced.',
          chain: copyrightChain.chain
        });
    };
  });
});
app.post('/vote', function(req, res) {
  
  const votedNode = req.body.voteFor;
  const totalNetworkReputation = reputation.reputationList.reduce((acc, curr) => acc + curr.reputation, 0);
  const voteWeight = reputation.voteWeight(totalNetworkReputation);
  const currentNodeUrl = copyrightChain.currentNodeUrl;

  if(votedNode != currentNodeUrl && copyrightChain.networkNodes.includes(votedNode)){
  // Add the voted node to the list of votes
  nodesVotes.push({ node: currentNodeUrl, votedFor: votedNode, voteWeight: voteWeight});

  // Broadcast the vote to all other nodes
  const requestPromises = [];
  copyrightChain.networkNodes.forEach(nodeUrl => {
    const requestOptions = {
      uri: nodeUrl + '/add-vote',
      method: 'POST',
      body: { node: currentNodeUrl ,
              votedFor: votedNode,
              voteWeight: voteWeight
            },
      json: true
    };
    requestPromises.push(rp(requestOptions));
  });

  Promise.all(requestPromises)
    .then(data => {
      res.json({ note: 'Vote cast and broadcast successfully.' });
    });
  }
  else{
    res.json({ note: 'Error, vote for another network node.' });
  }
});


// Endpoint for receiving a vote and adding it to the list of votes
app.post('/add-vote', function(req, res) {
  const node = req.body;
  nodesVotes.push(node);
  res.json({ note: 'Vote received and added to list.' });
});


app.get('/consensus-group', function(req, res) {
  const totalNetworkReputation = reputation.reputationList.reduce((acc, curr) => acc + curr.reputation, 0);
  const votes = {
    voteList: nodesVotes
  };  

  const counts = {};
  for (const vote of votes.voteList) {
    if (vote.votedFor) {
      if (!counts[vote.votedFor]) {
        counts[vote.votedFor] = 0;
      }
      counts[vote.votedFor] += vote.voteWeight;
    }
  }
  const percentages = {};
  for (const [node, count] of Object.entries(counts)) {
    percentages[node] = (count  * 100).toFixed(1) + '%';
  }
  const votedForNodes = new Set(votes.voteList.map(vote => vote.votedFor));
  const sumOfVotedForReputation = reputation.reputationList.reduce((acc, curr) => {
  if (votedForNodes.has(curr.node)) {
    acc += curr.reputation;
  }
  return acc;
  }, 0);
  const votedNodes = [...new Set(votes.voteList.map((vote) => vote.votedFor))];
  consensus.consensusGroup = consensus.setConsensusGroup(sumOfVotedForReputation,totalNetworkReputation, votedNodes);
  const consensusGroup = consensus.consensusGroup;
  if( consensusGroup.includes(copyrightChain.currentNodeUrl)){
    reputation.consensusParticipation = reputation.consensusParticipation + 1;
  }
  
  if (JSON.stringify(consensusGroup)  !== JSON.stringify([{note: "Consensus group not reached, group reputation < 50% of the total netwrok reputation."}]) ){
    res.json({ note: 'Consensus group created succefully', consensusGroup, votes});
    
  }else{
    
    res.json({ note: 'Consensus group not reached, group reputation < 50% of the total netwrok reputation.'});
  }

 
  
});


app.get('/consensus-explorer', function(req, res) {
  const requestPromises = [];
  copyrightChain.networkNodes.forEach(networkNodeUrl =>{
  // Get votes and percentages from the /consensus-group endpoint
  const consensusGroupOptions = {
    uri: networkNodeUrl + '/consensus-group',
    method: 'GET',
    json: true
  };
  requestPromises.push(rp(consensusGroupOptions));

  // Get the leader from the /leader endpoint
  const leaderOptions = {
    uri: networkNodeUrl + '/leader',
    method: 'GET',
    json: true
  };
  requestPromises.push(rp(leaderOptions));
  });
  Promise.all(requestPromises)
    .then(data => {
    
      const votes = data[0].votes;
      //const electionResult = data[0].percentages;
      const consensusGroup = data[0].consensusGroup;
      const leader = data[1].leader;

      let consensusExplorer = {
        votes,
        //electionResult,
        consensusGroup,
        leader
      };
      
      res.json({ consensusExplorer });
   
    })
    .catch(error => {
      console.log(error);
      res.status(500).send({ error: 'An error occurred while getting consensus explorer data' });
    });
});


app.get('/leader-broadcast', function(req, res) {
  const requestPromises = [];
  copyrightChain.networkNodes.forEach(networkNodeUrl =>{
    const requestOptions = {
        uri: networkNodeUrl + '/consensus-group',
        method: 'GET',
        json: true
    }; 
    requestPromises.push(rp(requestOptions));
  });
  Promise.all(requestPromises)
  .then(data => {
    if(consensus.consensusGroup.includes(copyrightChain.currentNodeUrl)){
      const leader = consensus.random(consensus.consensusGroup);
      const requestPromises = [];
      consensus.consensusGroup.forEach(nodeUrl => {
      const requestOptions = {
      uri: nodeUrl + '/leader-receive',
      method: 'POST',
      body: {
        leader: leader
      },
      json: true
    };
      requestPromises.push(rp(requestOptions));
  });
  Promise.all(requestPromises)
  .then(data => {
    res.json({ 
      leader: leader,
      note: 'Leader broadcasted to consensus group.' 
    });
  });
      
    }else{
      res.json({ note: 'Not a consensus member.' });
    }
  
  });
});

app.post('/leader-receive', function(req, res) {
  const leader = req.body.leader;
  consensus.leaderList.push(leader);
  res.json({ note: 'Leader received and added to leader list.' });

}); 

app.get('/leader', function(req, res){
if (consensus.leaderList.length === consensus.consensusGroup.length) {
  const leaderList = consensus.leaderList;

  // Count the occurrence of each element in the leaderList
  const occurrenceCount = {};
  leaderList.forEach(function(leader) {
    if (occurrenceCount[leader]) {
      occurrenceCount[leader]++;
    } else {
      occurrenceCount[leader] = 1;
    }
  });

  // Find the leader(s) with the highest occurrence
  let maxOccurrence = 0;
  let maxOccurrenceLeaders = [];
  for (const [leader, occurrence] of Object.entries(occurrenceCount)) {
    if (occurrence > maxOccurrence) {
      maxOccurrence = occurrence;
      maxOccurrenceLeaders = [leader];
    }  else if (occurrence === maxOccurrence) {
      maxOccurrenceLeaders.push(leader);
    }
  }

  // Pick a random leader if there are multiple leaders with the same highest occurrence
  consensus.leader = maxOccurrenceLeaders[0];

  // Send the chosen leader as a response
  res.json({ leader: consensus.leader });

  
} else{
  res.json({ note: 'Not all consensus group broadcasted the leader.'});
}
});

// app.post('/register-and-broadcast-reputation', function (req, res) {
//   const currentNodeUrl = copyrightChain.currentNodeUrl;
//   // Add the node URL and reputation rank to the reputation list
//   reputation.reputationList.push({
//     node: copyrightChain.currentNodeUrl,
//     reputation: reputation.reputationScore
//   });
//   const requestPromises = [];
//   copyrightChain.networkNodes.forEach(nodeUrl => {
//     const requestOptions = {
//       uri: nodeUrl + '/add-node-reputation',
//       method: 'POST',
//       body: { node: currentNodeUrl ,
//               reputation: reputation.reputationScore
//             },
//       json: true
//     };
//     requestPromises.push(rp(requestOptions));
//   });
//   Promise.all(requestPromises)
//     .then(data => {
//       res.json({ note: 'Reputation add and broadcast successfully.' });
//     });
// });
app.post('/add-node-reputation', function(req, res) {
  const node = req.body;
  if (!reputation.reputationList.some(node => node.node === req.body.node)){
  reputation.reputationList.push(node);
  }
  res.json({ note: 'Reputation received and added to list.' });
});
app.post('/register-reputation-bulk', function(req, res) {
  const reputationList = req.body.allNetworkNodesReputations;
  reputation.reputationList = reputationList;
});
app.post('/add-updated-node-reputation', function(req, res) {
  const node = req.body.node;
  const reputationScore = req.body.reputation;

  const index = reputation.reputationList.findIndex(n => n.node === node);
  if (index === -1) {
    // Node not found in the reputation list
    res.json({ error: 'Node not found in the reputation list.' });
  } else {
    // Update the reputation score of the node
    reputation.reputationList[index].reputation = reputationScore;
    res.json({ note: 'Reputation received and added to list.' });
  }
});


app.get('/reputation-explore', function(req, res) {
  
  
  const reputations = 
    
    {
    node: copyrightChain.currentNodeUrl,
    reputationList: reputation.reputationList
    }
    
    
 
  res.json({ reputations });
  
});

app.get('/reputation-update', function(req, res) {
  const currentNodeUrl = copyrightChain.currentNodeUrl;
  const currentNodeIndex = reputation.reputationList.findIndex(node => node.node === currentNodeUrl);
  const totalNetworkReputation = reputation.reputationList.reduce((acc, curr) => acc + curr.reputation, 0);
  const oldReputationScore = reputation.reputationList[currentNodeIndex].reputation;
  const reputationScore = reputation.calculateReputationScore(oldReputationScore, totalNetworkReputation, reputation.BlocksMined, reputation.consensusParticipation);

  // // Check if the current node exists in the reputation list
  
  if (currentNodeIndex !== -1) {
    // If the node already exists, update its reputation if necessary
    if ((reputation.reputationList[currentNodeIndex].reputation !== reputationScore) && (reputationScore < 1)) {
      
      reputation.reputationList[currentNodeIndex].reputation = reputationScore;
      const requestPromises = [];
      copyrightChain.networkNodes.forEach(nodeUrl => {
      const requestOptions = {
      uri: nodeUrl + '/add-updated-node-reputation',
      method: 'POST',
      body: { node: currentNodeUrl ,
              reputation: reputationScore
            },
      json: true
      };
      requestPromises.push(rp(requestOptions));
  });
  Promise.all(requestPromises)
    .then(data => {
      res.json({ note: 'Reputation updated successfully.' });
    });
      
    } else if((reputation.reputationList[currentNodeIndex].reputation !== reputationScore) && (reputationScore >= 1)) {
      reputation.reputationList[currentNodeIndex].reputation = 1;
      
      const requestPromises = [];
      copyrightChain.networkNodes.forEach(nodeUrl => {
      const requestOptions = {
      uri: nodeUrl + '/add-updated-node-reputation',
      method: 'POST',
      body: { node: currentNodeUrl ,
              reputation: 1
            },
      json: true
      };
      requestPromises.push(rp(requestOptions));
  });
  Promise.all(requestPromises)
  .then( data => {
    res.json({ note: 'You have reached the max of reputation score.' });
  });
      
    }
    else {
      res.json({ note: 'Reputation is already up to date.' });
    }
  }
  // res.json({reputationScore, totalNetworkReputation, blockmined: reputation.BlocksMined, consensusParticipation: reputation.consensusParticipation})
});


app.get('/block/:blockHash', function(req, res) {
  const blockHash = req.params.blockHash;
  const correctBlock = copyrightChain.getBlock(blockHash);
  res.json({ 
    block: correctBlock
  });
});
app.get('/transaction/:transactionId', function(req, res) {
  const transactionId = req.params.transactionId;
  const transactionData = copyrightChain.getTransaction(transactionId);
  res.json( {
      transaction: transactionData.transaction,
      block: transactionData.block
  });
});

app.get('/address/:address', function(req, res) {
  const address = req.params.address;
  const addressData = copyrightChain.getAddressData(address);
  res.json({
    addressData: addressData
  });
});

app.get('/block-explorer', function(req, res){
res.sendFile('./block-explorer/index.html', { root: __dirname });
});

app.get('/lab', (req, res) => {
  res.sendFile(__dirname + '/web-interface/lab.html');
  
});

app.get('/blockchain-web-interface', (req, res) => {
  res.sendFile(__dirname + '/web-interface/blockchain.html');
  
});
app.listen(port, function(){
    console.log(`Listening on port ${port}...`);
});
