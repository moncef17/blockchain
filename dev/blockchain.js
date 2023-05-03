const sha256 = require('sha256');
const crypto = require('crypto');
const currentNodeUrl = process.argv[3];
const uuid = require('uuid/v1');
const Reputation = require('./nodeReputation');
function Blockchain(){
    this.chain = [];
    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];
    this.pendingDatas = [];
    this.pendingTransactions = [];
    
    

    this.createNewBlock(0, '0', '0'); // Create the genesis block
}
Blockchain.prototype.createNewBlock = function(nonce, previousBlockHash, hash){
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        hash: hash,
        datas: this.pendingDatas,
        transactions: this.pendingTransactions,
        nonce: nonce,
        previousBlockHash: previousBlockHash

    };
    this.pendingTransactions = [];
    this.pendingDatas = [];
    this.chain.push(newBlock);
    return newBlock;

}
Blockchain.prototype.getLastBlock = function(){
    return this.chain[this.chain.length - 1];
}
Blockchain.prototype.createNewData = function(title, author, content, date){
    const newData = {
        title: title, //"The Title of Your Poem"
        author: author, //"The Name of the Poet"
        content: content, //"The lines of your poem. This can be a single string or an array of strings, depending on how you want to structure it."
        date: date, //"The date the poem was written or published, in ISO format (YYYY-MM-DD)"
        transactionId: uuid().split('-').join('') //"The unique ID of the transaction that added this poem to the blockchain."
    };
    
    
    return newData;
}
Blockchain.prototype.createNewTransaction = function(amount, sender, recipient){
    const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient,
        transactionId: uuid().split('-').join('')
    };
    
    return newTransaction;
}
Blockchain.prototype.addTransactionToPendingTrasactions = function(transacitonObj){
    this.pendingTransactions.push(transacitonObj);
    return this.getLastBlock()['index'] + 1;
};
Blockchain.prototype.addDataToPendingDatas = function(dataObj){
    this.pendingDatas.push(dataObj);
    return this.getLastBlock()['index'] + 1;
};
Blockchain.prototype.hashBlock = function(previousBlockHash, currentBlockData, nonce){
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);
    return hash;
}
Blockchain.prototype.proofOfWork = function(previousBlockHash, currentBlockData){
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while(hash.substring(0, 4) !== '0000'){
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }
    return nonce;
}

Blockchain.prototype.chainIsValid = function(blockchain){
    let validChain = true;
    for(var i = 1; i < blockchain.length; i++){
        const currentBlock = blockchain[i];
        const prevBlock = blockchain[i-1];
        const blockHash = this.hashBlock(prevBlock['hash'], { transactions: currentBlock['transactions'], datas: currentBlock['datas'],index: currentBlock['index'] }, currentBlock['nonce']);
        if(blockHash.substring(0, 4) !== '0000') validChain = false;
        if(currentBlock['previousBlockHash'] !== prevBlock['hash']) validChain = false;
    };
    const genesisBlock = blockchain[0];
    const correctNonce = genesisBlock['nonce'] === 0;
    const correctPreviousBlockHash = genesisBlock['previousBlockHash'] === '0';
    const correctHash = genesisBlock['hash'] === '0';
    const correctTransactions = genesisBlock['transactions'].length === 0;
    const correctDatas = genesisBlock['datas'].length === 0;
    if( !correctNonce || !correctPreviousBlockHash || !correctHash || !correctDatas) validChain = false;
    return validChain;
};
Blockchain.prototype.getBlock = function(blockHash){
    let correctBlock = null;
    this.chain.forEach(block => {
            if (block.hash === blockHash) correctBlock = block;
    });
    return correctBlock;
};

Blockchain.prototype.getTransaction = function(transactionId){
    let correctTransaction = null;
    let correctBlock = null;
    this.chain.forEach( block => {
        block.transactions.forEach(transaction => {
            if (transaction.transactionId === transactionId) {
                correctTransaction = transaction;
                correctBlock = block;
            };
        });
            
    });
    return {
        transaction: correctTransaction,
        block: correctBlock
    };
};
Blockchain.prototype.getData = function(transactionId){
    let correctData = null;
    let correctBlock = null;
    this.chain.forEach( block => {
        block.datas.forEach(data => {
            if (data.dataId === transactionId) {
                correctData = data;
                correctBlock = block;
            };
        });
            
    });
    return {
        data: correctData,
        block: correctBlock
    };
};

Blockchain.prototype.getAddressData = function(address) {
    const addressTransactions = [];
    this.chain.forEach(block => {
        block.transactions.forEach(transaction => {
                if(transaction.author === address || transaction.content === address) {
                    addressTransactions.push(transaction);
                };
        });
    });
        let balance = 0;
        addressTransactions.forEach(transaction => {
            if (transaction.content === address) balance += transaction.title;
            else if (transaction.author === address) balance -= transaction.title;
        });
          
        return {
        addressTransactions: addressTransactions,
        addressBalance: balance
    };
};

module.exports = Blockchain;
