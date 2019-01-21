/**
 * RPC agent, based on bitcore's RpcClient.
 */

const http = require('http');
const https = require('https');

/**
 * Source: https://en.bitcoin.it/wiki/Original_Bitcoin_client/API_calls_list
 * @type {Object}
 */
const BC_RPC = {
  abandonTransaction: [],
  abortRescan: [],
  addMultiSigAddress: [],
  addWitnessAddress: [],
  addNode: [],
  backupWallet: [],
  bumpFee: [],
  clearBanned: [],
  combineRawTransaction: [],
  convertPoints: [],
  createMultiSig: [],
  createRawTransaction: [],
  decodeRawTransaction: [],
  decodeScript: [],
  disconnectNode: [],
  dumpPrivKey: [],
  dumpWallet: [],
  encryptWallet: [],
  // deprecated: estimateFee [was never added to bcrpc]
  estimateSmartFee: [],
  fundRawTransaction: [],
  generate: [], // deprecated
  generateToAddress: [],
  getAccount: [],
  getAccountAddress: [],
  getAddedNodeInfo: [],
  getAddressInfo: [],
  getAddressesByAccount: [],
  getBalance: [],
  getBestBlockHash: [],
  getBlock: [],
  getBlockChainInfo: [],
  getBlockCount: [],
  getBlockHash: [],
  getBlockHeader: [],
  getBlockTemplate: [],
  getChainTips: [],
  getChainTxStats: [],
  getConnectionCount: [],
  getDifficulty: [],
  getGenerate: [],
  getHashesPerSec: [],
  getInfo: [],
  getMemoryInfo: [],
  getMempoolAncestors: [],
  getMempoolDescendants: [],
  getMempoolEntry: [],
  getMempoolInfo: [],
  getMiningInfo: [],
  getNetTotals: [],
  getNetworkHashPS: [],
  getNetworkInfo: [],
  getNewAddress: [],
  getPeerInfo: [],
  getRawChangeAddress: [],
  getRawMemPool: [], // kept for backwards compatibility
  getRawMempool: [],
  getRawTransaction: [],
  getReceivedByAccount: [],
  getReceivedByAddress: [],
  getTransaction: [],
  getTxOut: [],
  getTxOutProof: [],
  getTxOutSetInfo: [],
  getUnconfirmedBalance: [],
  getWalletInfo: [],
  getWork: [],
  help: [],
  importAddress: [],
  importMulti: [],
  importPrivKey: [],
  importPrunedFunds: [],
  importPubKey: [],
  importWallet: [],
  invalidateBlock: [],
  keyPoolRefill: [],
  listAccounts: [],
  listAddressGroupings: [],
  listBanned: [],
  listLockUnspent: [],
  listReceivedByAccount: [],
  listReceivedByAddress: [],
  listSinceBlock: [],
  listTransactions: [],
  listUnspent: [],
  listWallets: [],
  lockUnspent: [],
  move: [],
  ping: [],
  preciousBlock: [],
  prioritiseTransaction: [],
  pruneBlockChain: [],
  queryPoints: [],
  removePrunedFunds: [],
  saveMempool: [],
  sendFrom: [],
  sendMany: [],
  sendRawTransaction: [],
  sendToAddress: [],
  setAccount: [],
  setBan: [],
  setGenerate: [],
  setNetworkActive: [],
  setTxFee: [],
  signMessage: [],
  signMessageWithPrivKey: [],
  signRawTransaction: [], // deprecated
  signRawTransactionWithKey: [],
  signRawTransactionWithWallet: [],
  stop: [],
  submitBlock: [],
  uptime: [],
  validateAddress: [],
  verifyChain: [],
  verifyMessage: [],
  verifyTxOutProof: [],
  walletLock: [],
  walletPassPhrase: [],
  walletPassphraseChange: [],
};

const slice = (arr, start, end) => Array.prototype.slice.call(arr, start, end);

function RpcAgent (opts = {}) {
  this.host = opts.host || '127.0.0.1';
  this.port = opts.port || 8332;
  this.user = opts.user || 'user';
  this.pass = opts.pass || 'pass';
  this.prot = opts.ssl ? https : http;
}

function rpc (request, callback) {
  return new Promise((resolve, reject) => {
    const requestSerialized = JSON.stringify(request);
    const auth = new Buffer(`${this.user}:${this.pass}`).toString('base64');
    const options = {
      host: this.host,
      port: this.port,
      path: '/',
      method: 'POST',
    };
    let err = null;
    const req = this.prot.request(options, (res) => {
      let buf = '';
      res.on('data', (data) => {
        buf += data;
      });
      res.on('end', () => {
        if (res.statusCode === 401) {
          if (this.calb) {
            return callback(new Error('bitcoin JSON-RPC connection rejected: 401 unauthorized'));
          }
          return reject(new Error('bitcoin JSON-RPC connection rejected: 401 unauthorized'));
        }
        if (res.statusCode === 403) {
          if (this.calb) {
            return callback(new Error('bitcoin JSON-RPC connection rejected: 403 forbidden'));
          }
          return reject(new Error('bitcoin JSON-RPC connection rejected: 403 forbidden'));
        }
        if (err) {
          if (this.calb) {
            return callback(err);
          }
          return reject(err);
        }
        let bufDeserialized;
        try {
          bufDeserialized = JSON.parse(buf);
        } catch (e) {
          if (this.calb) {
            return callback(e);
          }
          return reject(e);
        }
        if (this.calb) {
          return callback(bufDeserialized.error, bufDeserialized);
        }
        if (bufDeserialized.error) {
          return reject(bufDeserialized.error);
        }
        return resolve(bufDeserialized.result);
      });
    });
    req.on('error', (e) => {
      err = new Error(`Could not connect to bitcoin via RPC at \
            host: ${this.host} port: ${this.port} Error: ${e.message}`);
      if (this.calb) {
        return callback(err);
      }
      return reject(err);
    });

    req.setHeader('Content-Length', requestSerialized.length);
    req.setHeader('Content-Type', 'application/json');
    req.setHeader('Authorization', `Basic ${auth}`);
    req.write(requestSerialized);
    req.end();
  });
}

for (const cmd of Object.keys(BC_RPC)) {
  RpcAgent.prototype[cmd] = function rpccmd (...args) {
    this.calb = typeof args[args.length - 1] === 'function';
    if (this.calb) {
      return rpc.call(this, {
        method: cmd.toLowerCase(),
        params: slice(args, 0, args.length - 1),
      }, args[args.length - 1]);
    }

    return rpc.call(this, {
      method: cmd.toLowerCase(),
      params: args
    });

  };
}

module.exports = RpcAgent;
