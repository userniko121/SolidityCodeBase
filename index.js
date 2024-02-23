const Web3 = require('web3');

class ContractInteraction {
  constructor(providerUrl) {
    this.web3 = new Web3(providerUrl);
  }

  async deployContract(abi, bytecode, from, ...args) {
    const contract = new this.web3.eth.Contract(abi);
    const deploy = contract.deploy({ data: bytecode, arguments: args });
    const transaction = deploy.send({ from: from, gas: 1500000, gasPrice: '30000000000000' });
    const deployedContract = await new Promise((resolve, reject) => {
      transaction.on('confirmation', (confirmationNumber, receipt) => {
        if (confirmationNumber >= 1) {
          resolve(receipt.contractAddress);
        }
      });
      transaction.on('error', reject);
    });
    return deployedContract;
  }

  async callContractMethod(abi, contractAddress, methodName, ...args) {
    const contract = new this.web3.eth.Contract(abi, contractAddress);
    const method = contract.methods[methodName](...args);
    const result = await method.call();
    return result;
  }

  async sendTransaction(abi, contractAddress, methodName, from, privateKey, ...args) {
    const contract = new this.web3.eth.Contract(abi, contractAddress);
    const method = contract.methods[methodName](...args);
    const encodedABI = method.encodeABI();
    const nonce = await this.web3.eth.getTransactionCount(from, 'pending');
    const gasPrice = await this.web3.eth.getGasPrice();
    const gasLimit = 3000000;
    const tx = {
      from: from,
      to: contractAddress,
      data: encodedABI,
      gas: gasLimit,
      gasPrice: gasPrice,
      nonce: nonce
    };
    const signedTx = await this.web3.eth.accounts.signTransaction(tx, privateKey);
    const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    return receipt;
  }
}

module.exports = ContractInteraction;
