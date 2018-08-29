# bcrpc
Tiny Bitcoin RPC wrapper for node.js

## Usage
Each rpc function is exposed as a function in an instantiated RpcAgent. The first arguments are parsed as array of arguments, as expected by that specific rpc function, see [Bitcoin-core RPC Docs](https://bitcoincore.org/en/doc). The last argument is an optional callback function, if no callback is provided, it will return a promise.

```
const RpcAgent = require('./rpc');

agent = new RpcAgent({port: 8332, user: 'username', pass: 'password'});

// Using Callbacks
agent.getBlockCount(function (err, blockCount) {
  if (err)
    throw Error(JSON.stringify(err));
  console.log(blockCount);
  agent.getBlockHash(blockCount, function (err, hash) {
    if (err)
      throw Error(JSON.stringify(err));
    console.log(hash);
  })
})


// Using Promises
agent.getBlockCount();
.then((blockCount) => {
  console.log(blockCount);
  return agent.getBlockHash();
})
.then((hash) => {
  console.log(hash);
})
.catch((err) => {
  console.error(err);
  return err;
})
```
