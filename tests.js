/* global describe it */
/* eslint import/no-extraneous-dependencies: 0 */
/* eslint no-console: 0 */
/* eslint no-unused-expressions: 0 */

const chai = require('chai');
const RpcClient = require('./index');
const async = require('async');

const expect = chai.expect;

const client = new RpcClient({
  prot: 'http',
  host: process.env.BITCOIND_HOST || 'localhost',
  port: process.env.BITCOIND_PORT || 18332,
  user: process.env.BITCOIND_USER || 'username',
  pass: process.env.BITCOIND_PASS || 'password',
});

function checkBitcoind(mcb) {
  let waitForBitcoind = true;
  let connFailurePrint = true;
  let syncPrint = true;
  let error = null;
  const expiry = new Date().getTime() + 1000;
  async.whilst(
    () => waitForBitcoind && expiry > new Date().getTime(),
    (cb) => {
      client.getInfo((err, gbt) => {
        error = err;
        if (err) {
          if (!gbt || (err.code && err.code === -9)) {
            // ECONNREFUSED, err === {} && !gbt
            // err.code === -9 for a split second during bitcoind startup
            if (connFailurePrint) {
              if (err.message === 'bitcoin JSON-RPC connection rejected: 401 unauthorized') {
                console.log('bitcoin JSON-RPC connection rejected: 401 unauthorized; the ' +
                  'username/password combination is invalid. Please set the BITCOIND_USER and ' +
                  'BITCOIND_PASS environment variables and try again.');
                waitForBitcoind = false;
                cb();
                return;
              }
              connFailurePrint = false;
            }
            setTimeout(cb, 200);
          } else if (err.code && err.code === -10) {
            // getBlockTemplate returns error code -10 while "Bitcoin is downloading blocks..."
            if (syncPrint) {
              console.log('bitcoind is syncing blocks ... waiting for completion');
              syncPrint = false;
            }
            setTimeout(cb, 1000);
          } else {
            // FATAL: unknown other error
            console.log('unknown bitcoind error; make sure BITCOIND_HOST and BITCOIND_PORT ' +
              'environment variables are set; e.g.\n' +
              '    BITCOIND_HOST=localhost BITCOIND_PORT=20003 npm test');
            waitForBitcoind = false;
            cb();
          }
        } else {
          waitForBitcoind = false;
          cb();
        }
      });
    },
    () => {
      if (waitForBitcoind) {
        // expired
        console.log('timeout waiting for bitcoind; make sure BITCOIND_HOST and BITCOIND_PORT ' +
          'environment variables are set; e.g.\n' +
          '    BITCOIND_HOST=localhost BITCOIND_PORT=20003 npm test');
        error = new Error('timeout waiting for bitcoind; ensure BITCOIND_HOST and BITCOIND_PORT ' +
          'environment variables are set; e.g.\n' +
          '    BITCOIND_HOST=localhost BITCOIND_PORT=20003 npm test');
      }
      if (error) {
        console.log('bitcoind error');
      }
      mcb(error);
    }
  );
}

describe('BitcoinD', () => {
  it('is running', (done) => {
    checkBitcoind((err) => {
      expect(err).to.be.null;
      done();
    });
  });
});

describe('bcrpc', () => {
  it('can get info', (done) => {
    client.getInfo((err, info) => {
      expect(err).to.be.null;
      expect(info).to.not.be.null;
      done();
    });
  });
});
