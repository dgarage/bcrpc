# bcrpc
Tiny Bitcoin RPC wrapper for node.js

## Usage
Each rpc function is exposed as a function in an instantiated RpcAgent. The first arguments are parsed as array of arguments, as expected by that specific rpc function, see [Bitcoin-core RPC Docs](https://bitcoincore.org/en/doc). The last argument is a callback function.

```
const RpcAgent = require('./rpc');

agent = new RpcAgent({port: 8332, user: 'username', pass: 'password'})

agent.getBlockCount(function (err, data) {
    if (err)
        throw Error(JSON.stringify(err))
    console.log(data.result)
})

agent.getBlockHash(101, function (err, data) {
    if (err)
        throw Error(JSON.stringify(err))
    console.log(data.result)
})

