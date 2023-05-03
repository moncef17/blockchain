const Blockchain = require('./blockchain');
const bitcoin = new Blockchain();
//console.log(bitcoin);
// const previousBlockHash = 'UDY7R78DHUJ';
// const currentBlockData = [
//     {
//         amount: 100,
//         sender: '3748DEU39',
//         recipient: '384UDHU8'
//     },
//     {
//         amount: 200,
//         sender: '9349UU39',
//         recipient: 'E9039UDI0'
//     }
// ]
// const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
// console.log(bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce));
// console.log('nonce: ' + nonce.toString());
const bc1 = {
    "chain": [
    {
    "index": 1,
    "timestamp": 1679080893904,
    "hash": "0",
    "transactions": [],
    "nonce": 0,
    "previousBlockHash": "0"
    },
    {
    "index": 2,
    "timestamp": 1679080911095,
    "hash": "0000f9123053cf7a38d8dde7c841c3c2a9f0cd66bbd4fdb79ccd74ec31e80a44",
    "transactions": [
    {
    "amount": 30,
    "sender": "DI30330JDKJQZ",
    "recipient": "JDI402JF5923D",
    "transactionId": "f1ae2a10c4f811ed81c1f3df2509115a"
    },
    {
    "amount": 20,
    "sender": "DI30330JDKJQZ",
    "recipient": "JDI402JF5923D",
    "transactionId": "f499b140c4f811ed81c1f3df2509115a"
    }
    ],
    "nonce": 93101,
    "previousBlockHash": "0"
    },
    {
    "index": 3,
    "timestamp": 1679080932669,
    "hash": "0000e47312a0f4911c27b415ceed07bb4d1292ffd5e94fd5647c410056cc116a",
    "transactions": [
    {
    "amount": 12.5,
    "sender": "00",
    "recipient": "edcecd00c4f811ed81c1f3df2509115a",
    "transactionId": "f811e810c4f811ed81c1f3df2509115a"
    },
    {
    "amount": 10,
    "sender": "DI30330JDKJQZ",
    "recipient": "JDI402JF5923D",
    "transactionId": "fca293c0c4f811ed81c1f3df2509115a"
    },
    {
    "amount": 40,
    "sender": "DI30330JDKJQZ",
    "recipient": "JDI402JF5923D",
    "transactionId": "ffcef480c4f811ed81c1f3df2509115a"
    }
    ],
    "nonce": 191385,
    "previousBlockHash": "0000f9123053cf7a38d8dde7c841c3c2a9f0cd66bbd4fdb79ccd74ec31e80a44"
    }
    ],
    "currentNodeUrl": "http://localhost:3001",
    "networkNodes": [],
    "pendingTransactions": [
    {
    "amount": 12.5,
    "sender": "00",
    "recipient": "edcecd00c4f811ed81c1f3df2509115a",
    "transactionId": "04eaa220c4f911ed81c1f3df2509115a"
    }
    ]
    }
console.log('VALID: ', bitcoin.chainIsValid(bc1.chain)); 
