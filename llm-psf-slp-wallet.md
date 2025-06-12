Project Path: psf-slp-wallet

Source Tree:

```
psf-slp-wallet
├── src
│   ├── lib
│   │   └── wallet-util.js
│   └── commands
│       ├── wallet-create.js
│       ├── token-info.js
│       ├── msg-verify.js
│       ├── send-bch.js
│       ├── wallet-list.js
│       ├── token-tx-history.js
│       ├── README.md
│       ├── send-tokens.js
│       ├── token-mda-tx.js
│       ├── wallet-sweep.js
│       ├── wallet-balance.js
│       ├── token-create-nft.js
│       ├── token-create-group.js
│       ├── token-create-fungible.js
│       ├── wallet-addrs.js
│       ├── msg-sign.js
│       └── token-mint.js
├── test
│   ├── unit
│   │   ├── lib
│   │   │   └── wallet-util.unit.js
│   │   └── commands
│   │       ├── send-tokens.unit.js
│   │       ├── token-mint.unit.js
│   │       ├── token-info.unit.js
│   │       ├── msg-verify.unit.js
│   │       ├── msg-sign.unit.js
│   │       ├── token-create-nft.unit.js
│   │       ├── wallet-sweep.unit.js
│   │       ├── wallet-balance.unit.js
│   │       ├── token-mda-tx.unit.js
│   │       ├── wallet-addrs.unit.js
│   │       ├── wallet-create.unit.js
│   │       ├── wallet-list.unit.js
│   │       ├── token-create-group.unit.js
│   │       ├── send-bch.unit.js
│   │       ├── token-create-fungible.unit.js
│   │       └── token-tx-history.unit.js
│   └── mocks
│       ├── msw-mock.js
│       └── wallet-service-mock.js
├── psf-slp-wallet.js
├── README.md
├── LICENSE.md
├── config
│   └── index.js
└── package.json

```

`/home/trout/work/psf/code/psf-slp-wallet/src/lib/wallet-util.js`:

```js
/*
  wallet-based utility functions used by several different commands
*/

// Global npm libraries.
import { promises as fs } from 'fs'
import { readFile } from 'fs/promises'
import BchWallet from 'minimal-slp-wallet'

// Local libraries
import config from '../../config/index.js'

// Global variables
const __dirname = import.meta.dirname

class WalletUtil {
  constructor () {
    // Encapsulate all dependencies
    this.fs = fs
    this.config = config
    this.BchWallet = BchWallet

    // Bind 'this' object to all subfunctions.
    this.saveWallet = this.saveWallet.bind(this)
  }

  // Save wallet data to a JSON file.
  async saveWallet (filename, walletData) {
    await this.fs.writeFile(filename, JSON.stringify(walletData, null, 2))

    return true
  }

  // Takes the wallet filename as input and returns an instance of
  // minimal-slp-wallet. Note: It will usually be best to run the
  // bchwallet.initialize() command after calling this function, to retrieve
  // the UTXOs held by the wallet.
  async instanceWallet (walletName) {
    try {
      // Input validation
      if (!walletName || typeof walletName !== 'string') {
        throw new Error('walletName is required.')
      }

      const filename = `${__dirname.toString()}/../../.wallets/${walletName}.json`

      // Load the wallet file.
      const walletStr = await readFile(filename)
      let walletData = JSON.parse(walletStr)
      walletData = walletData.wallet

      // Use info from the config file on how to initialize the wallet lib.
      const advancedConfig = {}
      advancedConfig.restURL = this.config.restURL
      advancedConfig.interface = this.config.interface
      advancedConfig.hdPath = walletData.hdPath

      const bchWallet = new this.BchWallet(walletData.mnemonic, advancedConfig)

      await bchWallet.walletInfoPromise

      return bchWallet
    } catch (err) {
      console.error('Error in wallet-util.js/instanceWallet()')
      throw err
    }
  }
}

export default WalletUtil

```

`/home/trout/work/psf/code/psf-slp-wallet/src/commands/wallet-create.js`:

```js
/*
  Create a new wallet.
*/

// Global npm libraries
import BchWallet from 'minimal-slp-wallet'

// Local libraries
import WalletUtil from '../lib/wallet-util.js'

// Global variables
const __dirname = import.meta.dirname

class WalletCreate {
  constructor () {
    // Encapsulate all dependencies
    this.BchWallet = BchWallet
    this.walletUtil = new WalletUtil()

    // Bind 'this' object to all subfunctions
    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.createWallet = this.createWallet.bind(this)
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      // Generate a filename for the wallet file.
      const filename = `${__dirname.toString()}/../../.wallets/${
        flags.name
      }.json`

      if (!flags.description) flags.description = ''

      console.log(`wallet-create executed with name ${flags.name} and description ${flags.description}`)

      const walletData = await this.createWallet(filename, flags.description)
      // console.log('walletData: ', walletData)

      return walletData
    } catch (err) {
      console.error('Error in WalletCreate.run(): ', err)
      return 0
    }
  }

  validateFlags (flags) {
    // Exit if wallet not specified.
    const name = flags.name
    if (!name || name === '') {
      throw new Error('You must specify a wallet name with the -n flag.')
    }

    return true
  }

  // Create a new wallet file.
  async createWallet (filename, desc) {
    try {
      if (!filename || typeof filename !== 'string') {
        throw new Error('filename required.')
      }

      if (!desc) desc = ''

      // Configure the minimal-slp-wallet library to use the JSON RPC over IPFS.
      // const advancedConfig = this.walletUtil.getRestServer()
      const advancedConfig = {}
      advancedConfig.noUpdate = true

      // Wait for the wallet to be created.
      this.bchWallet = new this.BchWallet(undefined, advancedConfig)
      await this.bchWallet.walletInfoPromise

      // console.log('bchWallet.walletInfo: ', this.bchWallet.walletInfo)

      // Create the initial wallet JSON object.
      const walletData = {
        wallet: this.bchWallet.walletInfo
      }
      walletData.wallet.description = desc

      // Write out the basic information into a json file for other apps to use.
      await this.walletUtil.saveWallet(filename, walletData)

      return walletData.wallet
    } catch (err) {
      console.log('Error in createWallet().')
      throw err
    }
  }
}

export default WalletCreate

```

`/home/trout/work/psf/code/psf-slp-wallet/src/commands/token-info.js`:

```js
/*
   This command is used to retrieve information about a token.
  It returns the Genesis data, mutable data, and immutable data associated
  with a token..
*/

// Global npm libraries
import BchWallet from 'minimal-slp-wallet'

// Local libraries
import config from '../../config/index.js'

class TokenInfo {
  constructor () {
    // Encapsulate dependencies.
    this.BchWallet = BchWallet
    this.config = config
    // Bind 'this' object to all subfunctions.
    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.getTokenData = this.getTokenData.bind(this)
    this.summarizeData = this.summarizeData.bind(this)
    this.getIpfsData = this.getIpfsData.bind(this)
    this.displayData = this.displayData.bind(this)
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      this.wallet = new this.BchWallet(undefined, { restURL: this.config.restURL, interface: this.config.interface, noUpdate: true })

      const tokenData = await this.getTokenData(flags)
      // console.log('tokenData: ', tokenData)

      const dataSummary = this.summarizeData(tokenData)
      // console.log('dataSummary: ', dataSummary)

      const mutableData = await this.getIpfsData(tokenData.mutableData)
      // console.log('Mutable Data: ', mutableData)

      const immutableData = await this.getIpfsData(tokenData.immutableData)
      // console.log('Immutable Data: ', immutableData)

      const allData = {
        dataSummary,
        tokenData,
        mutableData,
        immutableData
      }

      this.displayData(allData)

      return true
    } catch (err) {
      console.error('Error in token-info: ', err)
      return 0
    }
  }

  // Get the genesis data and IPFS URLs for mutable and immutable data, if available.
  async getTokenData (flags) {
    const tokenId = flags.tokenId

    const tokenData = await this.wallet.getTokenData(tokenId)

    return tokenData
  }

  // Summarize the raw genesis data into human readable stats.
  summarizeData (tokenData) {
    const decimals = tokenData.genesisData.decimals
    const tokensInCirculation = parseInt(tokenData.genesisData.tokensInCirculationStr) / Math.pow(10, decimals)
    const totalBurned = parseInt(tokenData.genesisData.totalBurned) / Math.pow(10, decimals)
    const totalMinted = parseInt(tokenData.genesisData.totalMinted) / Math.pow(10, decimals)

    return {
      tokensInCirculation,
      totalBurned,
      totalMinted
    }
  }

  // Retrieve IPFS data from a gateway
  async getIpfsData (ipfsUri) {
    try {
      if (!ipfsUri.includes('ipfs://')) { return 'not available' }

      const ipfsCid = ipfsUri.slice(7)
      // console.log('ipfsCid: ', ipfsCid)

      const ipfsData = await this.wallet.cid2json({ cid: ipfsCid })
      // console.log('url: ', url)

      // console.log('ipfsData: ', ipfsData)

      return ipfsData.json
    } catch (error) {
      return 'not available'
    }
  }

  displayData (allData) {
    console.log(`${JSON.stringify(allData, null, 2)}`)

    return true
  }

  // Validate the proper flags are passed in.
  validateFlags (flags) {
    const tokenId = flags.tokenId
    if (!tokenId || tokenId === '') {
      throw new Error('You must specify a token ID with the -t flag')
    }

    return true
  }
}

export default TokenInfo

```

`/home/trout/work/psf/code/psf-slp-wallet/src/commands/msg-verify.js`:

```js
/*
  Cryptographically verify a message and signature was signed by a provided
  BCH address.
*/

// Global npm libraries

// Local libraries
import BchWallet from 'minimal-slp-wallet'

class MsgVerify {
  constructor () {
    // Encapsulate Dependencies

    // Bind 'this' object to all subfunctions.
    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.verify = this.verify.bind(this)
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      // Initialize the wallet.
      this.bchWallet = new BchWallet()
      await this.bchWallet.walletInfoPromise

      // Sweep any BCH and tokens from the private key.
      const result = await this.verify(flags)

      console.log(`Message: ${flags.msg}`)
      console.log(`Signature: ${flags.sig}`)
      console.log(`Signature was generated by private key associated with address ${flags.addr}: ${result}`)

      return true
    } catch (err) {
      console.error('Error in msg-sign: ', err)
      return 0
    }
  }

  validateFlags (flags = {}) {
    // Exit if address not specified.
    const addr = flags.addr
    if (!addr || addr === '') {
      throw new Error('You must specify an address with the -a flag.')
    }

    // Exit if wallet not specified.
    const msg = flags.msg
    if (!msg || msg === '') {
      throw new Error('You must specify a message to sign with the -m flag.')
    }

    // Exit if signature not specified.
    const sig = flags.sig
    if (!sig || sig === '') {
      throw new Error('You must specify a signature with the -s flag.')
    }

    return true
  }

  async verify (flags) {
    try {
      const result = this.bchWallet.bchjs.BitcoinCash.verifyMessage(
        flags.addr,
        flags.sig,
        flags.msg
      )

      return result
    } catch (err) {
      console.error('Error in verify()')
      throw err
    }
  }
}

export default MsgVerify

```

`/home/trout/work/psf/code/psf-slp-wallet/src/commands/send-bch.js`:

```js
/*
  Command to send BCH to a given address.
*/

// Global npm libraries

// Local libraries
import WalletUtil from '../lib/wallet-util.js'

class SendBch {
  constructor () {
    // Encapsulate dependencies
    this.walletUtil = new WalletUtil()
    this.bchWallet = {} // Placeholder for instance of wallet.

    // Bind 'this' object to all subfunctions.
    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.sendBch = this.sendBch.bind(this)
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      // Initialize the wallet.
      this.bchWallet = await this.walletUtil.instanceWallet(flags.name)

      // Send the BCH
      const txid = await this.sendBch(flags)

      console.log(`TXID: ${txid}`)
      console.log('\nView this transaction on a block explorer:')
      console.log(`https://bch.loping.net/tx/${txid}`)

      return true
    } catch (err) {
      console.error('Error in send-bch: ', err)
      return 0
    }
  }

  validateFlags (flags = {}) {
    // Exit if wallet not specified.
    const name = flags.name
    if (!name || name === '') {
      throw new Error('You must specify a wallet name with the -n flag.')
    }

    // Exit if wallet not specified.
    const addr = flags.addr
    if (!addr || addr === '') {
      throw new Error('You must specify a receiver address with the -a flag.')
    }

    // Exit if quantity not specified.
    const qty = flags.qty
    if (!qty || qty === '') {
      throw new Error('You must specify a quantity in BCH with the -q flag.')
    }

    return true
  }

  // Give an instance of a wallet, an address, and a quantity, send the BCH.
  // Returns a TXID from a broadcasted transaction.
  async sendBch (flags) {
    try {
      // Update the wallet UTXOs.
      await this.bchWallet.initialize()

      const walletBalance = await this.bchWallet.getBalance()
      // console.log('walletBalance: ', walletBalance)

      if (walletBalance < flags.qty) {
        throw new Error(
          `Insufficient funds. You are trying to send ${flags.qty} BCH, but the wallet only has ${walletBalance} BCH`
        )
      }

      const receivers = [
        {
          address: flags.addr,
          amountSat: this.bchWallet.bchjs.BitcoinCash.toSatoshi(flags.qty)
        }
      ]

      const txid = await this.bchWallet.send(receivers)

      return txid
    } catch (err) {
      console.error('Error in sendBCH()')
      throw err
    }
  }
}

export default SendBch

```

`/home/trout/work/psf/code/psf-slp-wallet/src/commands/wallet-list.js`:

```js
/*
  List available wallets.
*/

// Global npm libraries
import shelljs from 'shelljs'
import Table from 'cli-table'
import { readFile } from 'fs/promises'

// Global variables
const __dirname = import.meta.dirname

class WalletList {
  constructor () {
    // Encapsulate dependencies
    this.shelljs = shelljs
    this.Table = Table

    // Bind 'this' object to all subfunctions.
    this.run = this.run.bind(this)
    this.parseWallets = this.parseWallets.bind(this)
    this.displayTable = this.displayTable.bind(this)
  }

  async run (flags) {
    try {
      const walletData = await this.parseWallets()
      // console.log(`walletData: ${JSON.stringify(walletData, null, 2)}`)

      this.displayTable(walletData)

      return true
    } catch (err) {
      console.error('Error in wallet-list: ', err)
      return 0
    }
  }

  // Parse data from the wallets directory into a formatted array.
  async parseWallets () {
    const fileList = this.shelljs.ls(
      `${__dirname.toString()}/../../.wallets/*.json`
    )
    // console.log('fileList: ', fileList)

    if (fileList.length === 0) {
      console.log('No wallets found.')
      return []
    }

    const retData = []

    // Loop through each wallet returned.
    for (let i = 0; i < fileList.length; i++) {
      const thisFile = fileList[i]
      // console.log(`thisFile: ${thisFile}`)

      const lastPart = thisFile.indexOf('.json')

      const lastSlash = thisFile.indexOf('.wallets/') + 1
      // console.log(`lastSlash: ${lastSlash}`)

      let name = thisFile.slice(8, lastPart)
      // console.log(`name: ${name}`)

      name = name.slice(lastSlash)

      // Read the contents of the wallet file.
      const walletStr = await readFile(thisFile)
      const walletInfo = JSON.parse(walletStr)

      retData.push([name, walletInfo.wallet.description])
    }

    return retData
  }

  // Display table in a table on the command line using cli-table.
  displayTable (data) {
    const table = new Table({
      head: ['Name', 'Description'],
      colWidths: [25, 55]
    })

    for (let i = 0; i < data.length; i++) table.push(data[i])

    const tableStr = table.toString()

    // Cut down on screen spam when running unit tests.
    console.log(tableStr)

    return tableStr
  }
}

export default WalletList

```

`/home/trout/work/psf/code/psf-slp-wallet/src/commands/token-tx-history.js`:

```js
/*
  This command is used to retrieve the transaction history for a token.
  This is more informative for NFTs than it is for fungible tokens.
*/

// Global npm libraries
import BchWallet from 'minimal-slp-wallet'

// Local libraries
import config from '../../config/index.js'

class TokenTxHistory {
  constructor () {
    // Encapsulate dependencies.
    this.BchWallet = BchWallet
    this.config = config
    // Bind 'this' object to all subfunctions.
    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.displayData = this.displayData.bind(this)
    this.getTxHistory = this.getTxHistory.bind(this)
  }

  async run (flags) {
    try {
      // Validate input flags
      this.validateFlags(flags)

      // Instantiate the wallet
      this.wallet = new this.BchWallet(undefined, { restURL: this.config.restURL, interface: this.config.interface, noUpdate: true })

      const txData = await this.getTxHistory(flags)

      const txs = { transactions: txData }
      this.displayData(txs)

      return true
    } catch (err) {
      console.log('Error in token-tx-history.js/run(): ', err.message)

      return 0
    }
  }

  // Display provided data
  displayData (txData) {
    console.log(`${JSON.stringify(txData, null, 2)}`)

    return true
  }

  // Get the genesis data with the txs
  async getTxHistory (flags) {
    const tokenId = flags.tokenId

    const tokenData = await this.wallet.getTokenData(tokenId, true)
    return tokenData.genesisData.txs
  }

  // Validate the proper flags are passed in.
  validateFlags (flags) {
    const tokenId = flags.tokenId
    if (!tokenId || tokenId === '') {
      throw new Error('You must specify a token ID with the -t flag')
    }

    return true
  }
}

export default TokenTxHistory

```

`/home/trout/work/psf/code/psf-slp-wallet/src/commands/README.md`:

```md
# Commands

All commands should follow the same structure:
- async **run()** is the primary execution function. This function shoudl always include a try/catch handler to report errors.
- **validateFlags()** should run first and preform input validation on input flags.

```

`/home/trout/work/psf/code/psf-slp-wallet/src/commands/send-tokens.js`:

```js
/*
  Send SLP tokens to an address.
*/

// Local libraries
import WalletUtil from '../lib/wallet-util.js'
import WalletBalance from './wallet-balance.js'

class SendTokens {
  constructor () {
    // Encapsulate dependencies
    this.walletUtil = new WalletUtil()
    this.bchWallet = {} // Placeholder for instance of wallet.
    this.walletBalance = new WalletBalance()

    // Bind 'this' object to all subfunctions.
    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.sendTokens = this.sendTokens.bind(this)
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      // Initialize the wallet.
      this.bchWallet = await this.walletUtil.instanceWallet(flags.name)

      // Send the BCH
      const txid = await this.sendTokens(flags)

      console.log(`TXID: ${txid}`)
      console.log('\nView this transaction on a block explorer:')
      console.log(`https://token.fullstack.cash/transactions/?txid=${txid}`)

      return true
    } catch (err) {
      console.error('Error in send-bch: ', err)
      return 0
    }
  }

  validateFlags (flags = {}) {
    // Exit if wallet not specified.
    const name = flags.name
    if (!name || name === '') {
      throw new Error('You must specify a wallet name with the -n flag.')
    }

    // Exit if wallet not specified.
    const addr = flags.addr
    if (!addr || addr === '') {
      throw new Error('You must specify a receiver address with the -a flag.')
    }

    // Exit if quantity not specified.
    const qty = flags.qty
    if (!qty || qty === '') {
      throw new Error('You must specify a quantity in BCH with the -q flag.')
    }

    // Exit if token ID not specified.
    const tokenId = flags.tokenId
    if (!tokenId || tokenId === '') {
      throw new Error('You must specify a token ID with the -t flag.')
    }

    return true
  }

  async sendTokens (flags) {
    try {
      // Update the wallet UTXOs.
      await this.bchWallet.initialize()

      // console.log('this.bchWallet.utxos.utxoStore: ', this.bchWallet.utxos.utxoStore)

      // Combine token UTXOs
      const tokenUtxos = this.bchWallet.utxos.utxoStore.slpUtxos.type1.tokens.concat(
        this.bchWallet.utxos.utxoStore.slpUtxos.group.tokens,
        this.bchWallet.utxos.utxoStore.slpUtxos.nft.tokens
      )

      // Isolate the token balances.
      const tokens = this.walletBalance.getTokenBalances(
        tokenUtxos
      )
      // console.log(`tokens: ${JSON.stringify(tokens, null, 2)}`)

      if (!tokens.length) {
        throw new Error('No tokens found on this wallet.')
      }
      // console.log('tokens', tokens)

      const tokenToSend = tokens.find(val => val.tokenId === flags.tokenId)
      // console.log('tokenToSend', tokenToSend)

      if (!tokenToSend) {
        throw new Error('No tokens in the wallet matched the given token ID.')
      }

      if (tokenToSend.qty < flags.qty) {
        throw new Error(
          `Insufficient funds. You are trying to send ${flags.qty}, but the wallet only has ${tokenToSend.qty}`
        )
      }

      const receiver = {
        address: flags.addr,
        tokenId: tokenToSend.tokenId,
        qty: flags.qty
      }

      const result = await this.bchWallet.sendTokens(receiver, 3.0)
      // console.log('result: ', result)

      return result
    } catch (err) {
      console.error('Error in sendTokens()')
      throw err
    }
  }
}

export default SendTokens

```

`/home/trout/work/psf/code/psf-slp-wallet/src/commands/token-mda-tx.js`:

```js
/*
 This command is used to generate a TXID for attaching mutable data to a token.
 Given a BCH address, it generates a transaction to turn that address into
 the controller of mutable data for a token. This generates a TXID which is
 used in the tokens 'documentHash' field when creating the token.

 MDA is an acrynym for 'Mutable Data Address'

 PS002 specification for mutable data:
 https://github.com/Permissionless-Software-Foundation/specifications/blob/master/ps002-slp-mutable-data.md
*/

// Local libraries
import config from '../../config/index.js'
import WalletUtil from '../lib/wallet-util.js'
import BCHJS from '@psf/bch-js'

class TokenMdaTx {
  constructor () {
    // Encapsulate dependencies.
    this.walletUtil = new WalletUtil()
    this.config = config

    // Bind 'this' object to all subfunctions.
    this.bchjs = new BCHJS()
    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.openWallet = this.openWallet.bind(this)
    this.generateMdaTx = this.generateMdaTx.bind(this)
    this.displayData = this.displayData.bind(this)
  }

  async run (flags) {
    try {
      // Validate input flags
      this.validateFlags(flags)

      // Instantiate the wallet and bch-js
      await this.openWallet(flags)

      const hex = await this.generateMdaTx(flags)
      // console.log('hex: ', hex)

      const txid = await this.wallet.broadcast({ hex })

      this.displayData(flags, txid)

      return true
    } catch (err) {
      console.log('Error in token-mda-tx.js/run(): ', err)
      return 0
    }
  }

  async openWallet (flags) {
    // Instantiate the wallet and bch-js
    const wallet = await this.walletUtil.instanceWallet(flags.walletName)
    await wallet.initialize()

    this.wallet = wallet
    const bchjs = wallet.bchjs
    this.bchjs = bchjs

    return wallet
  }

  // Generate a hex string for a transaction that initializes the MDA.
  async generateMdaTx (flags) {
    try {
      // Get a UTXO to pay for the transaction
      const bchUtxos = this.wallet.utxos.utxoStore.bchUtxos
      // console.log(`bchUtxos: ${JSON.stringify(bchUtxos, null, 2)}`)
      if (bchUtxos.length === 0) throw new Error('No BCH UTXOs available to pay for transaction.')

      // Pay for the tx with the biggest UTXO in the array.
      const bchUtxo = this.bchjs.Utxo.findBiggestUtxo(bchUtxos)
      // console.log(`bchUtxo: ${JSON.stringify(bchUtxo, null, 2)}`)

      // instance of transaction builder
      const transactionBuilder = new this.bchjs.TransactionBuilder()

      const originalAmount = bchUtxo.value
      const vout = bchUtxo.tx_pos
      const txid = bchUtxo.tx_hash

      // add input with txid and index of vout
      transactionBuilder.addInput(txid, vout)

      // Set the transaction fee. Manually set for ease of example.
      const txFee = 550
      const dust = 546

      // amount to send back to the sending address.
      // Subtract two dust transactions for minting baton and tokens.
      const remainder = originalAmount - dust * 1 - txFee

      // Generate the OP_RETURN data
      const script = [
        this.bchjs.Script.opcodes.OP_RETURN,
        Buffer.from(JSON.stringify({ mda: flags.mda }))
      ]

      // Compile the script array into a bitcoin-compliant hex encoded string.
      const data = this.bchjs.Script.encode(script)

      // Add the OP_RETURN output.
      transactionBuilder.addOutput(data, 0)

      // Send dust to the MDA to cryptographically link it to this TX.
      transactionBuilder.addOutput(flags.mda, dust)

      // add output to send BCH remainder of UTXO.
      transactionBuilder.addOutput(this.wallet.walletInfo.address, remainder)

      // Generate a keypair from the change address.
      const keyPair = this.bchjs.ECPair.fromWIF(this.wallet.walletInfo.privateKey)

      // Sign the transaction with the HD node.
      let redeemScript
      transactionBuilder.sign(
        0,
        keyPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        originalAmount
      )

      // build tx
      const tx = transactionBuilder.build()
      // output rawhex
      const hex = tx.toHex()

      return hex
    } catch (err) {
      console.error('Error in generateMdaTx()')
      throw err
    }
  }

  displayData (flags, txid) {
    console.log(`New Mutable Data Address ${flags.mda} initialized!`)
    console.log(`TXID: ${txid}`)
    console.log(`https://explorer.tokentiger.com/transactions/?txid=${txid}`)

    return true
  }

  // Validate the proper flags are passed in.
  validateFlags (flags) {
    // Exit if wallet not specified.
    const walletName = flags.walletName
    if (!walletName || walletName === '') {
      throw new Error('You must specify a wallet name with the -n flag.')
    }

    // Mutable data address
    const mda = flags.mda
    if (!mda || mda === '') {
      throw new Error('You must specify a mutable data address with the -a flag.')
    }

    // Check if the MDA is a valid BCH address
    this.bchjs.Address.isCashAddress(mda)

    return true
  }
}

export default TokenMdaTx

```

`/home/trout/work/psf/code/psf-slp-wallet/src/commands/wallet-sweep.js`:

```js
/*
  This command sweeps a private key in WIF format, and transfers any BCH or SLP
  tokens to the wallet.

  If only SLP tokens held by the private key, the wallet will need some BCH to
  pay TX fees for sweeping the tokens. If the private key has BCH, those
  funds will be used for TX fees.
*/

// Global npm libraries
import BchTokenSweep from 'bch-token-sweep'

// Local libraries
import WalletUtil from '../lib/wallet-util.js'

class WalletSweep {
  constructor () {
    // Encapsulate Dependencies
    this.BchTokenSweep = BchTokenSweep
    this.walletUtil = new WalletUtil()

    // Bind 'this' object to all subfunctions.
    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.sweepWif = this.sweepWif.bind(this)
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      // Initialize the wallet.
      this.bchWallet = await this.walletUtil.instanceWallet(flags.name)

      // Sweep any BCH and tokens from the private key.
      const txid = await this.sweepWif(flags)

      console.log(`BCH successfully swept from private key ${flags.wif}`)
      console.log(`TXID: ${txid}`)
      console.log('\nView this transaction on a block explorer:')
      console.log(`https://bch.loping.net/tx/${txid}`)

      return true
    } catch (err) {
      console.error('Error in send-bch: ', err)
      return 0
    }
  }

  validateFlags (flags = {}) {
    // Exit if wallet not specified.
    const name = flags.name
    if (!name || name === '') {
      throw new Error('You must specify a wallet name with the -n flag.')
    }

    // Exit if wallet not specified.
    const wif = flags.wif
    if (!wif || wif === '') {
      throw new Error('You must specify a private key to sweep with the -w flag.')
    }

    return true
  }

  async sweepWif (flags) {
    try {
      const walletWif = this.bchWallet.walletInfo.privateKey

      // Prepare the BCH Token Sweep library.
      const sweeper = new this.BchTokenSweep(
        flags.wif,
        walletWif,
        this.bchWallet
      )
      await sweeper.populateObjectFromNetwork()

      // Sweep the private key
      const hex = await sweeper.sweepTo(this.bchWallet.walletInfo.slpAddress)

      // Broadcast the transaction.
      const txid = await this.bchWallet.ar.sendTx(hex)

      return txid
    } catch (err) {
      console.error('Error in sweepWif()')
      throw err
    }
  }
}

export default WalletSweep

```

`/home/trout/work/psf/code/psf-slp-wallet/src/commands/wallet-balance.js`:

```js
/*
  Check the balance of a wallet in terms of BCH and SLP tokens.
*/

// Global npm libraries
import BchWallet from 'minimal-slp-wallet'
import collect from 'collect.js'
import fs from 'fs'

// Local libraries
import WalletUtil from '../lib/wallet-util.js'
import config from '../../config/index.js'

class WalletBalance {
  constructor () {
    // Encapsulate dependencies
    this.BchWallet = BchWallet
    this.walletUtil = new WalletUtil()
    this.config = config
    this.fs = fs
    this.collect = collect

    // Bind 'this' object to all subfunctions.
    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.getBalances = this.getBalances.bind(this)
    this.displayBalance = this.displayBalance.bind(this)
    this.getTokenBalances = this.getTokenBalances.bind(this)
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      // Initialize the wallet.
      this.bchWallet = await this.walletUtil.instanceWallet(flags.name)
      await this.bchWallet.initialize()

      // Get the wallet with updated UTXO data.
      const walletData = await this.getBalances()

      // Display wallet balances on the screen.
      this.displayBalance(walletData, flags)

      return true
    } catch (err) {
      console.error('Error in wallet-balance: ', err)
      return 0
    }
  }

  validateFlags (flags) {
    // Exit if wallet not specified.
    const name = flags.name
    if (!name || name === '') {
      throw new Error('You must specify a wallet name with the -n flag.')
    }

    return true
  }

  // Generate a new wallet instance and update it's balance. This function returns
  // a handle to an instance of the wallet library.
  // This function is called by other commands in this app.
  async getBalances () {
    try {
      // Loop through each BCH UTXO and add up the balance.
      let satBalance = 0
      for (let i = 0; i < this.bchWallet.utxos.utxoStore.bchUtxos.length; i++) {
        const thisUtxo = this.bchWallet.utxos.utxoStore.bchUtxos[i]

        satBalance += thisUtxo.value
      }
      const bchBalance = this.bchWallet.bchjs.BitcoinCash.toBitcoinCash(
        satBalance
      )
      this.bchWallet.satBalance = satBalance
      this.bchWallet.bchBalance = bchBalance

      return this.bchWallet
    } catch (err) {
      console.log('Error in getBalances()')
      throw err
    }
  }

  // Take the updated wallet data and display it on the screen.
  displayBalance (walletData, flags = {}) {
    try {
      // Loop through each BCH UTXO and add up the balance.
      console.log(
        `BCH balance: ${walletData.satBalance} satoshis or ${walletData.bchBalance} BCH`
      )

      // console.log(
      //   'walletData.utxos.utxoStore.slpUtxos.type1.tokens: ',
      //   walletData.utxos.utxoStore.slpUtxos.type1.tokens
      // )

      // Combine token UTXOs
      const tokenUtxos = walletData.utxos.utxoStore.slpUtxos.type1.tokens.concat(
        walletData.utxos.utxoStore.slpUtxos.group.tokens,
        walletData.utxos.utxoStore.slpUtxos.nft.tokens
      )

      // Print out SLP Type1 tokens
      console.log('\nTokens:')
      const tokens = this.getTokenBalances(
        // walletData.utxos.utxoStore.slpUtxos.type1.tokens
        tokenUtxos
      )
      for (let i = 0; i < tokens.length; i++) {
        const thisToken = tokens[i]
        console.log(`${thisToken.ticker} ${thisToken.qty} ${thisToken.tokenId}`)
      }

      // Print out minting batons
      const mintBatons = walletData.utxos.utxoStore.slpUtxos.type1.mintBatons.concat(
        walletData.utxos.utxoStore.slpUtxos.group.mintBatons
      )
      if (mintBatons.length > 0) {
        console.log('\nMinting Batons: ')
        // console.log(`walletData.utxos.utxoStore: ${JSON.stringify(walletData.utxos.utxoStore, null, 2)}`)

        for (let i = 0; i < mintBatons.length; i++) {
          const thisBaton = mintBatons[i]

          let type = 'Fungible'
          if (thisBaton.tokenType === 129) type = 'Group'

          console.log(`${thisBaton.ticker} (${type}) ${thisBaton.tokenId}`)
        }
      }

      // If verbose flag is set, display UTXO information.
      // if (flags.verbose) {
      //   console.log(
      //     `\nUTXO information:\n${JSON.stringify(
      //       walletData.utxos.utxoStore,
      //       null,
      //       2
      //     )}`
      //   )
      // }

      return true
    } catch (err) {
      console.error('Error in displayBalance()')
      throw err
    }
  }

  // Add up the token balances.
  // At the moment, minting batons, NFTs, and group tokens are not suported.
  getTokenBalances (tokenUtxos) {
    // console.log('tokenUtxos: ', tokenUtxos)

    const tokens = []
    const tokenIds = []

    // Summarized token data into an array of token UTXOs.
    for (let i = 0; i < tokenUtxos.length; i++) {
      const thisUtxo = tokenUtxos[i]

      const thisToken = {
        ticker: thisUtxo.ticker,
        tokenId: thisUtxo.tokenId,
        qty: parseFloat(thisUtxo.qtyStr)
      }

      tokens.push(thisToken)

      tokenIds.push(thisUtxo.tokenId)
    }

    // Create a unique collection of tokenIds
    const collection = collect(tokenIds)
    let unique = collection.unique()
    unique = unique.toArray()

    // Add up any duplicate entries.
    // The finalTokenData array contains unique objects, one for each token,
    // with a total quantity of tokens for the entire wallet.
    const finalTokenData = []
    for (let i = 0; i < unique.length; i++) {
      const thisTokenId = unique[i]

      const thisTokenData = {
        tokenId: thisTokenId,
        qty: 0
      }

      // Add up the UTXO quantities for the current token ID.
      for (let j = 0; j < tokens.length; j++) {
        const thisToken = tokens[j]

        if (thisTokenId === thisToken.tokenId) {
          thisTokenData.ticker = thisToken.ticker
          thisTokenData.qty += thisToken.qty
        }
      }

      finalTokenData.push(thisTokenData)
    }

    return finalTokenData
  }
}

export default WalletBalance

```

`/home/trout/work/psf/code/psf-slp-wallet/src/commands/token-create-nft.js`:

```js
/*
This command is used to create a NFT.
*/
// Local libraries
import config from '../../config/index.js'
import WalletUtil from '../lib/wallet-util.js'

class TokenCreateNFT {
  constructor () {
    // Encapsulate dependencies.
    this.walletUtil = new WalletUtil()
    this.config = config

    // Bind 'this' object to all subfunctions.
    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.openWallet = this.openWallet.bind(this)
    this.generateTokenTx = this.generateTokenTx.bind(this)
  }

  async run (flags) {
    try {
      // Validate input flags
      this.validateFlags(flags)

      // Instantiate the wallet and bch-js
      await this.openWallet(flags)

      const hex = await this.generateTokenTx(flags)
      // console.log('hex: ', hex)

      const txid = await this.wallet.broadcast({ hex })

      console.log(`New NFT ${flags.ticker} created! Token ID: ${txid}`)
      console.log(`https://explorer.tokentiger.com/?tokenid=${txid}`)

      return true
    } catch (err) {
      console.log('Error in token-create-nft.js/run(): ', err)
      return 0
    }
  }

  async openWallet (flags) {
    // Instantiate the wallet and bch-js
    const wallet = await this.walletUtil.instanceWallet(flags.walletName)
    await wallet.initialize()

    this.wallet = wallet
    const bchjs = wallet.bchjs
    this.bchjs = bchjs

    return wallet
  }

  // Generate a hex string transaction that will bring the token into existence.
  async generateTokenTx (flags) {
    try {
      // Get a UTXO to pay for the transaction
      const bchUtxos = this.wallet.utxos.utxoStore.bchUtxos
      if (bchUtxos.length === 0) throw new Error('No BCH UTXOs available to pay for transaction.')

      // Pay for the tx with the biggest UTXO in the array.
      const bchUtxo = this.bchjs.Utxo.findBiggestUtxo(bchUtxos)
      // console.log(`bchUtxo: ${JSON.stringify(bchUtxo, null, 2)}`)

      // Get a Group token UTXO
      const tokenId = flags.tokenId
      const groupUtxos = this.wallet.utxos.utxoStore.slpUtxos.group.tokens.filter(x => x.tokenId === tokenId)
      if (groupUtxos.length === 0) {
        throw new Error(`Group token with token ID ${tokenId} not found in wallet.`)
      }
      const groupUtxo = groupUtxos[0]

      // instance of transaction builder
      const transactionBuilder = new this.bchjs.TransactionBuilder()

      const originalAmount = bchUtxo.value
      const vout = bchUtxo.tx_pos
      const txid = bchUtxo.tx_hash

      // Add Group token as first input.
      transactionBuilder.addInput(groupUtxo.tx_hash, groupUtxo.tx_pos)

      // add input with txid and index of vout
      transactionBuilder.addInput(txid, vout)

      // Set the transaction fee. Manually set for ease of example.
      const txFee = 550

      // amount to send back to the sending address.
      // Subtract two dust transactions for minting baton and tokens.
      const remainder = originalAmount - 546 * 2 - txFee

      // Determine setting for document URL
      let documentUrl = ''
      if (flags.url) documentUrl = flags.url

      // Determine setting for document hash
      let documentHash = ''
      if (flags.hash) documentHash = flags.hash

      // Generate SLP config object
      const configObj = {
        name: flags.tokenName,
        ticker: flags.ticker,
        documentUrl,
        documentHash
      }

      // Generate the OP_RETURN entry for an SLP GENESIS transaction.
      const script = this.bchjs.SLP.NFT1.generateNFTChildGenesisOpReturn(configObj)

      // OP_RETURN needs to be the first output in the transaction.
      transactionBuilder.addOutput(script, 0)

      // Send dust transaction representing the tokens.
      const cashAddress = this.wallet.walletInfo.cashAddress
      transactionBuilder.addOutput(
        this.bchjs.Address.toLegacyAddress(cashAddress),
        546
      )

      // add output to send BCH remainder of UTXO.
      transactionBuilder.addOutput(cashAddress, remainder)

      // Generate a keypair from the change address.
      // const keyPair = bchjs.HDNode.toKeyPair(change)
      const keyPair = this.bchjs.ECPair.fromWIF(this.wallet.walletInfo.privateKey)

      // Sign the input with the Group token.
      let redeemScript
      transactionBuilder.sign(
        0,
        keyPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        groupUtxo.value
      )

      // Sign the BCH input to pay for the TX.
      transactionBuilder.sign(
        1,
        keyPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        originalAmount
      )

      // build tx
      const tx = transactionBuilder.build()
      // output rawhex
      const hex = tx.toHex()

      return hex
    } catch (err) {
      console.error('Error in generateTokenTx()')
      throw err
    }
  }

  // Validate the proper flags are passed in.
  validateFlags (flags) {
    // Exit if wallet not specified.
    const walletName = flags.walletName
    if (!walletName || walletName === '') {
      throw new Error('You must specify a wallet name with the -n flag.')
    }

    const tokenName = flags.tokenName
    if (!tokenName || tokenName === '') {
      throw new Error('You must specify a name for the token with the -m flag.')
    }

    const ticker = flags.ticker
    if (!ticker || ticker === '') {
      throw new Error('You must specify a ticker for the token with the -t flag.')
    }
    const tokenId = flags.tokenId
    if (!tokenId || tokenId === '') {
      throw new Error('You must specify a tokenId ( Group token to burn ) for the NFT with the -i flag.')
    }

    return true
  }
}

export default TokenCreateNFT

```

`/home/trout/work/psf/code/psf-slp-wallet/src/commands/token-create-group.js`:

```js
/*
This command is used to create a new SLP Group token.
*/
// Local libraries
import config from '../../config/index.js'
import WalletUtil from '../lib/wallet-util.js'

class TokenCreateGroup {
  constructor () {
    // Encapsulate dependencies.
    this.walletUtil = new WalletUtil()
    this.config = config

    // Bind 'this' object to all subfunctions.
    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.openWallet = this.openWallet.bind(this)
    this.generateTokenTx = this.generateTokenTx.bind(this)
  }

  async run (flags) {
    try {
      // Validate input flags
      this.validateFlags(flags)

      // Instantiate the wallet and bch-js
      await this.openWallet(flags)

      const hex = await this.generateTokenTx(flags)
      // console.log('hex: ', hex)

      // Broadcast the transaction to the blockchain network.
      // const txid = await this.wallet.ar.sendTx(hex)
      const txid = await this.wallet.broadcast({ hex })

      console.log(`New token ${flags.ticker} created! Token ID: ${txid}`)
      console.log(`https://explorer.tokentiger.com/?tokenid=${txid}`)

      return true
    } catch (err) {
      console.log('Error in token-create-group.js/run(): ', err)
      return 0
    }
  }

  async openWallet (flags) {
    // Instantiate the wallet and bch-js
    const wallet = await this.walletUtil.instanceWallet(flags.walletName)
    await wallet.initialize()

    this.wallet = wallet
    const bchjs = wallet.bchjs
    this.bchjs = bchjs

    return wallet
  }

  // Generate a hex string transaction that will bring the token into existence.
  async generateTokenTx (flags) {
    try {
      // Get a UTXO to pay for the transaction
      const bchUtxos = this.wallet.utxos.utxoStore.bchUtxos
      if (bchUtxos.length === 0) throw new Error('No BCH UTXOs available to pay for transaction.')

      // Pay for the tx with the biggest UTXO in the array.
      const bchUtxo = this.bchjs.Utxo.findBiggestUtxo(bchUtxos)
      // console.log(`bchUtxo: ${JSON.stringify(bchUtxo, null, 2)}`)

      // instance of transaction builder
      const transactionBuilder = new this.bchjs.TransactionBuilder()

      const originalAmount = bchUtxo.value
      const vout = bchUtxo.tx_pos
      const txid = bchUtxo.tx_hash

      // add input with txid and index of vout
      transactionBuilder.addInput(txid, vout)

      // Set the transaction fee. Manually set for ease of example.
      const txFee = 550

      // amount to send back to the sending address.
      // Subtract two dust transactions for minting baton and tokens.
      const remainder = originalAmount - 546 * 2 - txFee

      // Determine setting for document URL
      let documentUrl = ''
      if (flags.url) documentUrl = flags.url

      // Determine setting for document hash
      let documentHash = ''
      if (flags.hash) documentHash = flags.hash

      let initialQty = 1
      if (flags.qty) initialQty = parseInt(flags.qty)

      // Generate SLP config object
      const configObj = {
        name: flags.tokenName,
        ticker: flags.ticker,
        documentUrl,
        initialQty,
        documentHash,
        mintBatonVout: 2
      }

      // Generate the OP_RETURN entry for an SLP GENESIS transaction.
      const script = this.bchjs.SLP.NFT1.newNFTGroupOpReturn(configObj)

      // OP_RETURN needs to be the first output in the transaction.
      transactionBuilder.addOutput(script, 0)

      // Send dust transaction representing the tokens.
      const cashAddress = this.wallet.walletInfo.cashAddress
      transactionBuilder.addOutput(
        this.bchjs.Address.toLegacyAddress(cashAddress),
        546
      )

      // Send dust transaction representing minting baton.
      transactionBuilder.addOutput(
        this.bchjs.Address.toLegacyAddress(cashAddress),
        546
      )

      // add output to send BCH remainder of UTXO.
      transactionBuilder.addOutput(cashAddress, remainder)

      // Generate a keypair from the change address.
      // const keyPair = bchjs.HDNode.toKeyPair(change)
      const keyPair = this.bchjs.ECPair.fromWIF(this.wallet.walletInfo.privateKey)

      // Sign the transaction with the HD node.
      let redeemScript
      transactionBuilder.sign(
        0,
        keyPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        originalAmount
      )

      // build tx
      const tx = transactionBuilder.build()
      // output rawhex
      const hex = tx.toHex()

      return hex
    } catch (err) {
      console.error('Error in generateTokenTx()')
      throw err
    }
  }

  // Validate the proper flags are passed in.
  validateFlags (flags) {
    // Exit if wallet not specified.
    const walletName = flags.walletName
    if (!walletName || walletName === '') {
      throw new Error('You must specify a wallet name with the -n flag.')
    }

    const tokenName = flags.tokenName
    if (!tokenName || tokenName === '') {
      throw new Error('You must specify a name for the token with the -m flag.')
    }

    const ticker = flags.ticker
    if (!ticker || ticker === '') {
      throw new Error('You must specify a ticker for the token with the -t flag.')
    }

    return true
  }
}

export default TokenCreateGroup

```

`/home/trout/work/psf/code/psf-slp-wallet/src/commands/token-create-fungible.js`:

```js
/*
This command is used to create a new SLP Type1 fungible token.
*/

// Global npm libraries
import WalletUtil from '../lib/wallet-util.js'

// Local libraries
import config from '../../config/index.js'

class TokenCreateFungible {
  constructor () {
    // Encapsulate dependencies.
    this.walletUtil = new WalletUtil()
    this.config = config
    // Bind 'this' object to all subfunctions.
    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.openWallet = this.openWallet.bind(this)
    this.generateTokenTx = this.generateTokenTx.bind(this)
  }

  async run (flags) {
    try {
      // Validate input flags
      this.validateFlags(flags)

      // Instantiate the wallet and bch-js
      await this.openWallet(flags)

      const hex = await this.generateTokenTx(flags)
      // console.log('hex: ', hex)

      // Broadcast the transaction to the blockchain network.
      const txid = await this.wallet.broadcast({ hex })

      console.log(`New token ${flags.ticker} created! Token ID: ${txid}`)
      console.log(`https://explorer.tokentiger.com/?tokenid=${txid}`)

      return true
    } catch (err) {
      console.log('Error in token-create-fungible.js/run(): ', err)

      return 0
    }
  }

  async openWallet (flags) {
    // Instantiate the wallet and bch-js
    const wallet = await this.walletUtil.instanceWallet(flags.walletName)
    await wallet.initialize()

    this.wallet = wallet
    const bchjs = wallet.bchjs
    this.bchjs = bchjs

    return wallet
  }

  // Generate a hex string transaction that will bring the token into existence.
  async generateTokenTx (flags) {
    try {
      // Get a UTXO to pay for the transaction
      const bchUtxos = this.wallet.utxos.utxoStore.bchUtxos
      if (bchUtxos.length === 0) throw new Error('No BCH UTXOs available to pay for transaction.')

      // Pay for the tx with the biggest UTXO in the array.
      const bchUtxo = this.bchjs.Utxo.findBiggestUtxo(bchUtxos)
      // console.log(`bchUtxo: ${JSON.stringify(bchUtxo, null, 2)}`)

      // instance of transaction builder
      const transactionBuilder = new this.bchjs.TransactionBuilder()

      const originalAmount = bchUtxo.value
      const vout = bchUtxo.tx_pos
      const txid = bchUtxo.tx_hash

      // add input with txid and index of vout
      transactionBuilder.addInput(txid, vout)

      // Set the transaction fee. Manually set for ease of example.
      const txFee = 550

      // amount to send back to the sending address.
      // Subtract two dust transactions for minting baton and tokens.
      const remainder = originalAmount - 546 * 2 - txFee

      // Determine minting baton
      let mintBaton = null // Default is burn mint baton
      if (flags.baton) mintBaton = 2 // 2nd output of tx

      // Determine setting for document URL
      let documentUrl = ''
      if (flags.url) documentUrl = flags.url

      // Determine setting for document hash
      let documentHash = ''
      if (flags.hash) documentHash = flags.hash

      // Generate SLP config object
      const configObj = {
        name: flags.tokenName,
        ticker: flags.ticker,
        documentUrl,
        decimals: flags.decimals,
        initialQty: flags.qty,
        documentHash,
        mintBatonVout: mintBaton
      }

      // Generate the OP_RETURN entry for an SLP GENESIS transaction.
      const script = this.bchjs.SLP.TokenType1.generateGenesisOpReturn(configObj)

      // OP_RETURN needs to be the first output in the transaction.
      transactionBuilder.addOutput(script, 0)

      // Send dust transaction representing the tokens.
      const cashAddress = this.wallet.walletInfo.cashAddress
      transactionBuilder.addOutput(
        this.bchjs.Address.toLegacyAddress(cashAddress),
        546
      )

      // Send dust transaction representing minting baton.
      if (mintBaton) {
        transactionBuilder.addOutput(
          this.bchjs.Address.toLegacyAddress(cashAddress),
          546
        )
      }

      // add output to send BCH remainder of UTXO.
      transactionBuilder.addOutput(cashAddress, remainder)

      // Generate a keypair from the change address.
      // const keyPair = bchjs.HDNode.toKeyPair(change)
      const keyPair = this.bchjs.ECPair.fromWIF(this.wallet.walletInfo.privateKey)

      // Sign the transaction with the HD node.
      let redeemScript
      transactionBuilder.sign(
        0,
        keyPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        originalAmount
      )

      // build tx
      const tx = transactionBuilder.build()
      // output rawhex
      const hex = tx.toHex()

      return hex
    } catch (err) {
      console.error('Error in generateTokenTx()')
      throw err
    }
  }

  // Validate the proper flags are passed in.
  validateFlags (flags) {
    // Exit if wallet not specified.
    const walletName = flags.walletName
    if (!walletName || walletName === '') {
      throw new Error('You must specify a wallet name with the -n flag.')
    }

    const tokenName = flags.tokenName
    if (!tokenName || tokenName === '') {
      throw new Error('You must specify a name for the token with the -m flag.')
    }

    const ticker = flags.ticker
    if (!ticker || ticker === '') {
      throw new Error('You must specify a ticker for the token with the -t flag.')
    }

    const decimals = flags.decimals
    if (isNaN(Number(decimals))) {
      throw new TypeError(
        'You must specify the decimals of the token the -d flag.'
      )
    }

    const qty = flags.qty
    if (isNaN(Number(qty))) {
      throw new TypeError(
        'You must specify a quantity of tokens to create with the -q flag.'
      )
    }

    return true
  }
}

export default TokenCreateFungible

```

`/home/trout/work/psf/code/psf-slp-wallet/src/commands/wallet-addrs.js`:

```js
/*
  List the addresses for a wallet
*/

// Global npm libraries
import shelljs from 'shelljs'
import { readFile } from 'fs/promises'

// Global variables
const __dirname = import.meta.dirname

class WalletAddrs {
  constructor () {
    // Encapsulate dependencies
    this.shelljs = shelljs

    // Bind 'this' object to all subfunctions.
    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.getAddrs = this.getAddrs.bind(this)
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      // Generate a filename for the wallet file.
      const filename = `${__dirname.toString()}/../../.wallets/${
        flags.name
      }.json`

      return await this.getAddrs(filename)
    } catch (err) {
      console.error('Error in wallet-addrs: ', err)
      return 0
    }
  }

  validateFlags (flags) {
    // Exit if wallet not specified.
    const name = flags.name
    if (!name || name === '') {
      throw new Error('You must specify a wallet name with the -n flag.')
    }

    return true
  }

  async getAddrs (filename) {
    try {
      // Load the wallet file.
      const walletStr = await readFile(filename)
      let walletData = JSON.parse(walletStr)
      walletData = walletData.wallet

      console.log(' ')
      console.log(`Cash Address: ${walletData.cashAddress}`)
      console.log(`SLP Address: ${walletData.slpAddress}`)
      console.log(`Legacy Address: ${walletData.legacyAddress}`)
      console.log(' ')
      return walletData
    } catch (err) {
      console.error('Error in getAddrs()')
      throw err
    }
  }
}

export default WalletAddrs

```

`/home/trout/work/psf/code/psf-slp-wallet/src/commands/msg-sign.js`:

```js
/*
  Cryptographically sign a message with your private key.
*/

// Global npm libraries

// Local libraries
import WalletUtil from '../lib/wallet-util.js'

class MsgSign {
  constructor () {
    // Encapsulate Dependencies
    this.walletUtil = new WalletUtil()

    // Bind 'this' object to all subfunctions.
    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.sign = this.sign.bind(this)
  }

  async run (flags) {
    try {
      this.validateFlags(flags)

      // Initialize the wallet.
      this.bchWallet = await this.walletUtil.instanceWallet(flags.name)

      // Sweep any BCH and tokens from the private key.
      const signObj = await this.sign(flags)

      console.log('Signed message with key associated with this address: ', signObj.bchAddr)
      console.log(`Input message: ${signObj.msg}`)
      console.log('Signature:')
      console.log(signObj.signature)

      return true
    } catch (err) {
      console.error('Error in msg-sign: ', err)
      return 0
    }
  }

  validateFlags (flags = {}) {
    // Exit if wallet not specified.
    const name = flags.name
    if (!name || name === '') {
      throw new Error('You must specify a wallet name with the -n flag.')
    }

    // Exit if wallet not specified.
    const msg = flags.msg
    if (!msg || msg === '') {
      throw new Error('You must specify a message to sign with the -m flag.')
    }

    return true
  }

  async sign (flags) {
    try {
      const walletWif = this.bchWallet.walletInfo.privateKey

      const signature = this.bchWallet.bchjs.BitcoinCash.signMessageWithPrivKey(
        walletWif,
        flags.msg
      )

      const outObj = {
        signature,
        bchAddr: this.bchWallet.walletInfo.cashAddress,
        msg: flags.msg
      }

      return outObj
    } catch (err) {
      console.error('Error in sign()')
      throw err
    }
  }
}

export default MsgSign

```

`/home/trout/work/psf/code/psf-slp-wallet/src/commands/token-mint.js`:

```js
/*
This command is used to Mint additional fungible (Type 1) or Group tokens if the wallet has a minting
baton.
*/
// Local libraries
import config from '../../config/index.js'
import WalletUtil from '../lib/wallet-util.js'

class TokenMint {
  constructor () {
    // Encapsulate dependencies.
    this.walletUtil = new WalletUtil()
    this.config = config

    // Bind 'this' object to all subfunctions.
    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.openWallet = this.openWallet.bind(this)
    this.generateMintTx = this.generateMintTx.bind(this)
  }

  async run (flags) {
    try {
      // Validate input flags
      this.validateFlags(flags)

      // Instantiate the wallet and bch-js
      await this.openWallet(flags)

      const hex = await this.generateMintTx(flags)
      // console.log('hex: ', hex)

      const txid = await this.wallet.broadcast({ hex })

      console.log(`New NFT Minted! Token ID: ${txid}`)
      console.log(`https://explorer.tokentiger.com/?tokenid=${txid}`)

      return true
    } catch (err) {
      console.log('Error in token-mint.js/run(): ', err)
      return 0
    }
  }

  async openWallet (flags) {
    // Instantiate the wallet and bch-js
    const wallet = await this.walletUtil.instanceWallet(flags.walletName)
    await wallet.initialize()

    this.wallet = wallet
    const bchjs = wallet.bchjs
    this.bchjs = bchjs

    return wallet
  }

  // Generate a hex string transaction that will bring the token into existence.
  async generateMintTx (flags) {
    try {
      // Get a UTXO to pay for the transaction
      const bchUtxos = this.wallet.utxos.utxoStore.bchUtxos
      if (bchUtxos.length === 0) throw new Error('No BCH UTXOs available to pay for transaction.')

      // Pay for the tx with the biggest UTXO in the array.
      const bchUtxo = this.bchjs.Utxo.findBiggestUtxo(bchUtxos)
      // console.log(`bchUtxo: ${JSON.stringify(bchUtxo, null, 2)}`)

      // instance of transaction builder
      const transactionBuilder = new this.bchjs.TransactionBuilder()

      const originalAmount = bchUtxo.value
      const vout = bchUtxo.tx_pos
      const txid = bchUtxo.tx_hash

      // add input with txid and index of vout
      transactionBuilder.addInput(txid, vout)

      // Get mint batons.
      const mintBatons = this.wallet.utxos.utxoStore.slpUtxos.type1.mintBatons.concat(
        this.wallet.utxos.utxoStore.slpUtxos.group.mintBatons
      )

      // Filter out the batons for the selected token.
      const filteredBatons = mintBatons.filter(x => x.tokenId === flags.tokenId)
      if (filteredBatons.length === 0) {
        throw new Error(`A minting baton for token ID ${flags.tokenId} could not be found in the wallet.`)
      }

      const mintBaton = filteredBatons[0]
      // console.log(`mintBaton: ${JSON.stringify(mintBaton, null, 2)}`)

      // add the mint baton as an input.
      transactionBuilder.addInput(mintBaton.tx_hash, mintBaton.tx_pos)

      // Set the transaction fee. Manually set for ease of example.
      const txFee = 550

      // amount to send back to the sending address.
      // Subtract two dust transactions for minting baton and tokens.
      const remainder = originalAmount - 546 * 2 - txFee

      // Destroy the baton?
      let destroyBaton = false
      if (flags.receiver === 'null') destroyBaton = true

      // Generate the OP_RETURN entry for an SLP MINT transaction.
      let script
      if (mintBaton.tokenType === 129) {
        script = this.bchjs.SLP.NFT1.mintNFTGroupOpReturn([mintBaton], flags.qty, destroyBaton)
      } else {
        // tokenType === 1 (fungible token)
        script = this.bchjs.SLP.TokenType1.generateMintOpReturn([mintBaton], flags.qty, destroyBaton)
      }

      // OP_RETURN needs to be the first output in the transaction.
      transactionBuilder.addOutput(script, 0)

      // Send dust transaction representing the tokens.
      const cashAddress = this.wallet.walletInfo.cashAddress
      transactionBuilder.addOutput(
        this.bchjs.Address.toLegacyAddress(cashAddress),
        546
      )

      // Send dust transaction representing minting baton.
      if (!destroyBaton) {
        if (flags.receiver) {
          transactionBuilder.addOutput(
            this.bchjs.Address.toLegacyAddress(flags.receiver),
            546
          )
        } else {
          transactionBuilder.addOutput(
            this.bchjs.Address.toLegacyAddress(cashAddress),
            546
          )
        }
      }

      // add output to send BCH remainder of UTXO.
      transactionBuilder.addOutput(cashAddress, remainder)

      // Generate a keypair from the change address.
      // const keyPair = bchjs.HDNode.toKeyPair(change)
      const keyPair = this.bchjs.ECPair.fromWIF(this.wallet.walletInfo.privateKey)

      // Sign the first input
      let redeemScript
      transactionBuilder.sign(
        0,
        keyPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        originalAmount
      )

      // Sign the second input
      transactionBuilder.sign(
        1,
        keyPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        mintBaton.value
      )

      // build tx
      const tx = transactionBuilder.build()
      // output rawhex
      const hex = tx.toHex()

      return hex
    } catch (err) {
      console.error('Error in generateMintTx()')
      throw err
    }
  }

  // Validate the proper flags are passed in.
  validateFlags (flags) {
    // Exit if wallet not specified.
    const walletName = flags.walletName
    if (!walletName || walletName === '') {
      throw new Error('You must specify a wallet name with the -n flag.')
    }

    const qty = flags.qty
    if (isNaN(Number(qty))) {
      throw new TypeError(
        'You must specify a quantity of tokens to create with the -q flag.'
      )
    }

    const tokenId = flags.tokenId
    if (!tokenId || tokenId === '') {
      throw new Error('You must specify a tokenId ( Group token to burn ) for the NFT with the -t flag.')
    }

    return true
  }
}

export default TokenMint

```

`/home/trout/work/psf/code/psf-slp-wallet/test/unit/lib/wallet-util.unit.js`:

```js
/*
  Unit tests for the wallet-util.js library.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import WalletUtil from '../../../src/lib/wallet-util.js'
import WalletCreate from '../../../src/commands/wallet-create.js'

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#wallet-util', () => {
  let uut
  let sandbox

  before(async () => {
    // Create a mainnet wallet.
    const createWallet = new WalletCreate()
    await createWallet.createWallet(filename)
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new WalletUtil()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    // Clean up
    await fs.rm(filename)
  })

  describe('#saveWallet', () => {
    it('should save a wallet file', async () => {
      const result = await uut.saveWallet(filename, {})

      await fs.rm(filename)

      // Create new mainnet wallet as part of cleanup.
      const createWallet = new WalletCreate()
      await createWallet.createWallet(filename)

      assert.equal(result, true)
    })
  })

  describe('#instanceWallet', () => {
    it('should generate an instance of the wallet', async () => {
      const wallet = await uut.instanceWallet('test123')

      assert.property(wallet, 'walletInfo')
    })

    it('should throw error if wallet name is not specified', async () => {
      try {
        await uut.instanceWallet()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'walletName is required.')
      }
    })
  })
})

```

`/home/trout/work/psf/code/psf-slp-wallet/test/unit/commands/send-tokens.unit.js`:

```js
/*
  Unit tests for send-tokens command.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import WalletCreate from '../../../src/commands/wallet-create.js'
import WalletUtil from '../../../src/lib/wallet-util.js'
import SendTokens from '../../../src/commands/send-tokens.js'

const walletCreate = new WalletCreate()
const walletUtil = new WalletUtil()

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#send-tokens', () => {
  let uut
  let sandbox

  before(async () => {
    await walletCreate.createWallet(filename)
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new SendTokens()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    await fs.rm(filename)
  })

  describe('#send-tokens', () => {
    it('should send SLP tokens to provided address', async () => {
      // Instantiate the minimal-slp-wallet
      uut.bchWallet = await walletUtil.instanceWallet('test123')

      uut.bchWallet.utxos.utxoStore = {
        slpUtxos: {
          type1: {
            tokens: []
          },
          group: {
            tokens: []
          },
          nft: {
            tokens: []
          }
        }
      }

      const mockTokenBalance = [
        {
          tokenId: '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0',
          qty: 0.5,
          ticker: 'PSF'
        }
      ]

      // Mock the wallet functions so we don't make network calls.
      sandbox.stub(uut.bchWallet, 'initialize').resolves()
      sandbox.stub(uut.walletBalance, 'getTokenBalances').returns(mockTokenBalance)
      sandbox.stub(uut.bchWallet, 'sendTokens').resolves('fake-txid')

      const flags = {
        name: 'test123',
        qty: 0.01,
        addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl',
        tokenId: '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0'
      }

      const result = await uut.sendTokens(flags)

      assert.equal(result, 'fake-txid')
    })

    it('should throw error if wallet balance is less than quanity to send', async () => {
      try {
      // Instantiate the minimal-slp-wallet
        uut.bchWallet = await walletUtil.instanceWallet('test123')

        uut.bchWallet.utxos.utxoStore = {
          slpUtxos: {
            type1: {
              tokens: []
            },
            group: {
              tokens: []
            },
            nft: {
              tokens: []
            }
          }
        }

        const mockTokenBalance = [
          {
            tokenId: '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0',
            qty: 0.5,
            ticker: 'PSF'
          }
        ]

        // Mock the wallet functions so we don't make network calls.
        sandbox.stub(uut.bchWallet, 'initialize').resolves()
        sandbox.stub(uut.walletBalance, 'getTokenBalances').returns(mockTokenBalance)
        sandbox.stub(uut.bchWallet, 'sendTokens').resolves('fake-txid')

        const flags = {
          name: 'test123',
          qty: 0.75,
          addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl',
          tokenId: '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0'
        }

        await uut.sendTokens(flags)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Insufficient funds.')
      }
    })

    it('should throw error if wallet contains no tokens', async () => {
      try {
      // Instantiate the minimal-slp-wallet
        uut.bchWallet = await walletUtil.instanceWallet('test123')

        uut.bchWallet.utxos.utxoStore = {
          slpUtxos: {
            type1: {
              tokens: []
            },
            group: {
              tokens: []
            },
            nft: {
              tokens: []
            }
          }
        }

        const mockTokenBalance = []

        // Mock the wallet functions so we don't make network calls.
        sandbox.stub(uut.bchWallet, 'initialize').resolves()
        sandbox.stub(uut.walletBalance, 'getTokenBalances').returns(mockTokenBalance)
        sandbox.stub(uut.bchWallet, 'sendTokens').resolves('fake-txid')

        const flags = {
          name: 'test123',
          qty: 0.75,
          addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl',
          tokenId: '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0'
        }

        await uut.sendTokens(flags)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'No tokens found on this wallet.')
      }
    })

    it('should throw error if token with token ID is not foundin wallet', async () => {
      try {
      // Instantiate the minimal-slp-wallet
        uut.bchWallet = await walletUtil.instanceWallet('test123')

        uut.bchWallet.utxos.utxoStore = {
          slpUtxos: {
            type1: {
              tokens: []
            },
            group: {
              tokens: []
            },
            nft: {
              tokens: []
            }
          }
        }

        const mockTokenBalance = [
          {
            tokenId: '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b1',
            qty: 0.5,
            ticker: 'PSF'
          }
        ]

        // Mock the wallet functions so we don't make network calls.
        sandbox.stub(uut.bchWallet, 'initialize').resolves()
        sandbox.stub(uut.walletBalance, 'getTokenBalances').returns(mockTokenBalance)
        sandbox.stub(uut.bchWallet, 'sendTokens').resolves('fake-txid')

        const flags = {
          name: 'test123',
          qty: 0.75,
          addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl',
          tokenId: '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0'
        }

        await uut.sendTokens(flags)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'No tokens in the wallet matched the given token ID.')
      }
    })
  })

  describe('#validateFlags()', () => {
    it('validateFlags() should return true if all arguments are supplied.', () => {
      const flags = {
        name: 'test123',
        qty: 1,
        addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl',
        tokenId: '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0'
      }

      assert.equal(uut.validateFlags(flags), true, 'return true')
    })

    it('validateFlags() should throw error if name is not supplied.', () => {
      try {
        uut.validateFlags({})

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet name with the -n flag',
          'Expected error message.'
        )
      }
    })

    it('validateFlags() should throw error if addr is not supplied.', () => {
      try {
        const flags = {
          name: 'test123'
        }
        uut.validateFlags(flags)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a receiver address with the -a flag.',
          'Expected error message.'
        )
      }
    })

    it('validateFlags() should throw error if qty is not supplied.', () => {
      try {
        const flags = {
          name: 'test123',
          addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl'
        }
        uut.validateFlags(flags)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a quantity in BCH with the -q flag.',
          'Expected error message.'
        )
      }
    })

    it('validateFlags() should throw error if token ID is not supplied.', () => {
      try {
        const flags = {
          name: 'test123',
          addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl',
          qty: 0.1
        }
        uut.validateFlags(flags)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a token ID with the -t flag.',
          'Expected error message.'
        )
      }
    })
  })

  describe('#run', () => {
    it('should execute the run function', async () => {
      // Mock dependencies
      sandbox.stub(uut, 'sendTokens').resolves('fake-txid')

      const flags = {
        name: 'test123',
        qty: 0.01,
        addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl',
        tokenId: '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0'
      }

      const result = await uut.run(flags)

      assert.equal(result, true)
    })

    it('should handle an error', async () => {
      const result = await uut.run()

      assert.equal(result, 0)
    })
  })
})

```

`/home/trout/work/psf/code/psf-slp-wallet/test/unit/commands/token-mint.unit.js`:

```js
/*
Unit tests for the token-mint command.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import TokenMint from '../../../src/commands/token-mint.js'
import MinimalSlpWalletMock from '../../mocks/msw-mock.js'
import WalletCreate from '../../../src/commands/wallet-create.js'
const walletCreate = new WalletCreate()

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#token-mint', () => {
  let uut
  let sandbox
  let mockWallet

  before(async () => {
    await walletCreate.createWallet(filename)
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new TokenMint()
    mockWallet = new MinimalSlpWalletMock()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    await fs.rm(filename)
  })

  describe('#validateFlags()', () => {
    it('should return true if all arguments are included', () => {
      const flags = {
        walletName: 'test123',
        tokenId: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        qty: 1,
        receiver: 'bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h'
      }

      assert.equal(uut.validateFlags(flags), true, 'return true')
    })

    it('should throw error if wallet name is not supplied.', () => {
      try {
        const flags = {}
        uut.validateFlags(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet name with the -n flag.',
          'Expected error message.'
        )
      }
    })
    it('should throw error if token quantity are not supplied.', () => {
      try {
        const flags = {
          walletName: 'test123'
        }
        uut.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a quantity of tokens to create with the -q flag.',
          'Expected error message.'
        )
      }
    })
    it('should throw error if  tokenId is not supplied.', () => {
      try {
        const flags = {
          walletName: 'test123',
          qty: 1
        }
        uut.validateFlags(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a tokenId ( Group token to burn ) for the NFT with the -t flag',
          'Expected error message.'
        )
      }
    })
  })

  describe('#openWallet', () => {
    it('should return an instance of the wallet', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

      const flags = {
        walletName: 'test123'
      }

      const result = await uut.openWallet(flags)
      // console.log('result: ', result)

      assert.property(result, 'walletInfoPromise')
    })
  })

  describe('#generateMintTx', () => {
    it('should generate a hex transaction for a Type1 token', async () => {
      // Mock data
      const bchUtxo = {
        height: 744046,
        tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        tx_pos: 3,
        value: 577646,
        txid: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        vout: 3,
        address: 'bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h',
        isSlp: false,
        satoshis: 577646
      }

      const flags = {
        name: 'test123',
        qty: 1,
        tokenId: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684'
      }

      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

      // Instantiate the wallet and bch-js
      await uut.openWallet(flags)

      // Force UTXOs:
      uut.wallet.utxos.utxoStore = {
        bchUtxos: [bchUtxo],
        slpUtxos: {
          type1: {
            mintBatons: [{
              tokenId: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
              tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
              tx_pos: 4,
              value: 546,
              tokenType: 1,
              utxoType: 'minting-baton',
              decimals: 2
            }]
          },
          group: {
            mintBatons: []
          }
        }
      }

      const result = await uut.generateMintTx(flags)
      // console.log('result: ', result)

      assert.include(result, '020000000')
    })

    it('should throw an error if there are no BCH UTXOs to pay for tx', async () => {
      try {
        const flags = {
          name: 'test123',
          qty: 1,
          tokenId: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684'
        }

        // Mock dependencies and force desired code path
        sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

        // Instantiate the wallet and bch-js
        await uut.openWallet(flags)

        // Force bchUtxo.
        uut.wallet.utxos.utxoStore.bchUtxos = []

        await uut.generateMintTx(flags)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'No BCH UTXOs available to pay for transaction.')
      }
    })

    it('should throw an error if minting baton is not found', async () => {
      try {
        const flags = {
          name: 'test123',
          qty: 1,
          tokenId: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684'
        }

        // Mock dependencies and force desired code path
        sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

        // Instantiate the wallet and bch-js
        await uut.openWallet(flags)

        // Force UTXOs:
        uut.wallet.utxos.utxoStore = {
          bchUtxos: [{
            height: 744046,
            tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
            tx_pos: 3,
            value: 577646,
            txid: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
            vout: 3,
            address: 'bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h',
            isSlp: false,
            satoshis: 577646
          }],
          slpUtxos: {
            type1: {
              mintBatons: []
            },
            group: {
              mintBatons: []
            }
          }
        }

        await uut.generateMintTx(flags)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'A minting baton for token ID')
      }
    })

    it('should generate a hex transaction for a Group token', async () => {
      // Mock data
      const bchUtxo = {
        height: 744046,
        tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        tx_pos: 3,
        value: 577646,
        txid: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        vout: 3,
        address: 'bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h',
        isSlp: false,
        satoshis: 577646
      }

      const flags = {
        name: 'test123',
        qty: 1,
        tokenId: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684'
      }

      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

      // Instantiate the wallet and bch-js
      await uut.openWallet(flags)

      // Force UTXOs:
      uut.wallet.utxos.utxoStore = {
        bchUtxos: [bchUtxo],
        slpUtxos: {
          type1: {
            mintBatons: [{
              tokenId: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
              tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
              tx_pos: 4,
              value: 546,
              tokenType: 129,
              utxoType: 'minting-baton',
              decimals: 2
            }]
          },
          group: {
            mintBatons: []
          }
        }
      }

      const result = await uut.generateMintTx(flags)
      // console.log('result: ', result)

      assert.include(result, '020000000')
    })

    it('should burn the minting baton', async () => {
      // Mock data
      const bchUtxo = {
        height: 744046,
        tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        tx_pos: 3,
        value: 577646,
        txid: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        vout: 3,
        address: 'bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h',
        isSlp: false,
        satoshis: 577646
      }

      const flags = {
        name: 'test123',
        qty: 1,
        tokenId: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        receiver: 'null'
      }

      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

      // Instantiate the wallet and bch-js
      await uut.openWallet(flags)

      // Force UTXOs:
      uut.wallet.utxos.utxoStore = {
        bchUtxos: [bchUtxo],
        slpUtxos: {
          type1: {
            mintBatons: [{
              tokenId: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
              tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
              tx_pos: 4,
              value: 546,
              tokenType: 1,
              utxoType: 'minting-baton',
              decimals: 2
            }]
          },
          group: {
            mintBatons: []
          }
        }
      }

      const result = await uut.generateMintTx(flags)
      // console.log('result: ', result)

      assert.include(result, '020000000')
    })

    it('should send minting baton to alternate receiver', async () => {
      // Mock data
      const bchUtxo = {
        height: 744046,
        tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        tx_pos: 3,
        value: 577646,
        txid: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        vout: 3,
        address: 'bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h',
        isSlp: false,
        satoshis: 577646
      }

      const flags = {
        name: 'test123',
        qty: 1,
        tokenId: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        receiver: 'bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h'
      }

      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

      // Instantiate the wallet and bch-js
      await uut.openWallet(flags)

      // Force UTXOs:
      uut.wallet.utxos.utxoStore = {
        bchUtxos: [bchUtxo],
        slpUtxos: {
          type1: {
            mintBatons: [{
              tokenId: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
              tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
              tx_pos: 4,
              value: 546,
              tokenType: 1,
              utxoType: 'minting-baton',
              decimals: 2
            }]
          },
          group: {
            mintBatons: []
          }
        }
      }

      const result = await uut.generateMintTx(flags)
      // console.log('result: ', result)

      assert.include(result, '020000000')
    })
  })

  describe('#run', () => {
    it('should execute the run function', async () => {
      // Mock dependencies
      uut.wallet = new MinimalSlpWalletMock()
      sandbox.stub(uut, 'validateFlags').returns(true)
      sandbox.stub(uut, 'openWallet').resolves(mockWallet)
      sandbox.stub(uut, 'generateMintTx').resolves('fake-hex')

      const result = await uut.run({})

      assert.equal(result, true)
    })

    it('should handle an error', async () => {
      const result = await uut.run()

      assert.equal(result, 0)
    })
  })
})

```

`/home/trout/work/psf/code/psf-slp-wallet/test/unit/commands/token-info.unit.js`:

```js
/*
  Unit tests for the token-info command
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Local libraries
import TokenInfo from '../../../src/commands/token-info.js'
import WalletServiceMock from '../../mocks/wallet-service-mock.js'

describe('#token-info', () => {
  let uut
  let sandbox

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new TokenInfo()
    uut.BchWallet = WalletServiceMock
    uut.wallet = new WalletServiceMock()
  })

  afterEach(() => {
    sandbox.restore()
  })

  // after(async () => {
  //   await fs.rm(filename)
  // })

  describe('#validateFlags()', () => {
    it('should return true if all arguments are included', () => {
      const flags = {
        tokenId: 'abc123'
      }

      assert.equal(uut.validateFlags(flags), true, 'return true')
    })

    it('should throw error if tokenId is not supplied.', () => {
      try {
        const flags = {}
        uut.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a token ID with the -t flag',
          'Expected error message.'
        )
      }
    })
  })

  describe('#getTokenData', () => {
    it('should get token data', async () => {
      const flags = {
        tokenId: 'abc'
      }

      const result = await uut.getTokenData(flags)

      assert.isObject(result, 'Expected Object as Result')
    })
  })

  describe('#summarizeData', () => {
    it('should summarize the genesis data', () => {
      // Mock data
      const tokenData = {
        genesisData: {
          decimals: 2,
          tokensInCirculationStr: '100097954686',
          totalBurned: '2045314',
          totalMinted: '100100000000'
        }
      }

      const result = uut.summarizeData(tokenData)
      // console.log(result)

      assert.equal(result.tokensInCirculation, 1000979546.86)
      assert.equal(result.totalBurned, 20453.14)
      assert.equal(result.totalMinted, 1001000000)
    })
  })

  describe('#getIpfsData', () => {
    it('should get IPFS data from a gateway', async () => {
      // Mock network calls
      sandbox.stub(uut.wallet, 'cid2json').resolves({ json: { schema: 'schema version' } })

      const ipfsUri = 'ipfs://bafybeicp4n4jxm6z6yuftlqvkrgxj3elzctnjn2ufmwz7ivijfowleg6j4'

      const result = await uut.getIpfsData(ipfsUri)
      // console.log(result)

      assert.isObject(result, 'Expected Object as Result')
      assert.property(result, 'schema', 'Expected schema property')
      assert.equal(result.schema, 'schema version', 'Expected schema version')
    })

    it('should return "not-available" if ipfs URI is not found', async () => {
      const ipfsUri = 'blah'

      const result = await uut.getIpfsData(ipfsUri)

      assert.equal(result, 'not available')
    })
    it('should return "not-available" on error', async () => {
      // Mock network calls
      sandbox.stub(uut.wallet, 'cid2json').throws(new Error('test error'))

      const ipfsUri = 'ipfs://bafybeicp4n4jxm6z6yuftlqvkrgxj3elzctnjn2ufmwz7ivijfowleg6j4'

      const result = await uut.getIpfsData(ipfsUri)

      assert.equal(result, 'not available')
    })
  })

  describe('#displayData', () => {
    it('should display the final data', () => {
      const allData = {
        tokenData: 'a',
        dataSummary: 'b',
        immutableData: 'c',
        mutableData: 'd'
      }

      const result = uut.displayData(allData)

      assert.equal(result, true)
    })
  })

  describe('#run', () => {
    it('should execute the run function', async () => {
      // Mock dependencies
      sandbox.stub(uut, 'validateFlags').returns(true)
      sandbox.stub(uut, 'getTokenData').resolves({})
      sandbox.stub(uut, 'summarizeData').returns({})
      sandbox.stub(uut, 'getIpfsData').resolves({})
      sandbox.stub(uut, 'displayData').returns(true)

      const result = await uut.run()

      assert.equal(result, true)
    })

    it('should handle an error', async () => {
      const result = await uut.run()

      assert.equal(result, 0)
    })
  })
})

```

`/home/trout/work/psf/code/psf-slp-wallet/test/unit/commands/msg-verify.unit.js`:

```js
/*
  Unit tests for msg-verify command.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
// import { promises as fs } from 'fs'
import BchWallet from 'minimal-slp-wallet'

// Local libraries
import MsgVerify from '../../../src/commands/msg-verify.js'

describe('#msg-sign', () => {
  let uut
  let sandbox

  before(async () => {
    // await walletCreate.createWallet(filename)
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new MsgVerify()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    // await fs.rm(filename)
  })

  describe('#verify', () => {
    it('should verify a signature', async () => {
      // Initialize the wallet library.
      const bchWallet = new BchWallet()
      await bchWallet.walletInfoPromise
      uut.bchWallet = bchWallet

      const flags = {
        addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl',
        sig: 'IOdfv+TQNCNIEJ4uvcUJmX9ZCEbkNNv9ad+TLO/JJxzeWDhqx42iBXMPEnthldl9wGx/Fwdjwp1w9532mSXzENM=',
        msg: 'This is a test message'
      }

      const result = await uut.verify(flags)

      assert.equal(result, true)
    })

    it('should catch, report, and throw errors', async () => {
      try {
        // Initialize the wallet library.
        const bchWallet = new BchWallet()
        await bchWallet.walletInfoPromise
        uut.bchWallet = bchWallet

        await uut.verify({})

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Unsupported address format')
      }
    })
  })

  describe('#validateFlags()', () => {
    it('validateFlags() should return true if all arguments are supplied.', () => {
      const flags = {
        addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl',
        sig: 'IOdfv+TQNCNIEJ4uvcUJmX9ZCEbkNNv9ad+TLO/JJxzeWDhqx42iBXMPEnthldl9wGx/Fwdjwp1w9532mSXzENM=',
        msg: 'This is a test message'
      }

      assert.equal(uut.validateFlags(flags), true, 'return true')
    })

    it('validateFlags() should throw error if addr is not supplied.', () => {
      try {
        uut.validateFlags({})

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify an address with the -a flag.',
          'Expected error message.'
        )
      }
    })

    it('validateFlags() should throw error if msg is not supplied.', () => {
      try {
        const flags = {
          addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl'
        }
        uut.validateFlags(flags)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a message to sign with the -m flag.',
          'Expected error message.'
        )
      }
    })

    it('validateFlags() should throw error if sig is not supplied.', () => {
      try {
        const flags = {
          addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl',
          msg: 'This is a test message'
        }
        uut.validateFlags(flags)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a signature with the -s flag.',
          'Expected error message.'
        )
      }
    })
  })

  describe('#run', () => {
    it('should execute the run function', async () => {
      const flags = {
        addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl',
        sig: 'IOdfv+TQNCNIEJ4uvcUJmX9ZCEbkNNv9ad+TLO/JJxzeWDhqx42iBXMPEnthldl9wGx/Fwdjwp1w9532mSXzENM=',
        msg: 'This is a test message'
      }

      const result = await uut.run(flags)

      assert.equal(result, true)
    })

    it('should handle an error', async () => {
      const result = await uut.run()

      assert.equal(result, 0)
    })
  })
})

```

`/home/trout/work/psf/code/psf-slp-wallet/test/unit/commands/msg-sign.unit.js`:

```js
/*
  Unit tests for msg-sign function
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import WalletCreate from '../../../src/commands/wallet-create.js'
import MsgSign from '../../../src/commands/msg-sign.js'
import WalletUtil from '../../../src/lib/wallet-util.js'

const walletUtil = new WalletUtil()
const walletCreate = new WalletCreate()

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#msg-sign', () => {
  let uut
  let sandbox

  before(async () => {
    await walletCreate.createWallet(filename)
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new MsgSign()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    await fs.rm(filename)
  })

  describe('#sign', () => {
    it('should sign a message', async () => {
      // Instantiate the minimal-slp-wallet
      uut.bchWallet = await walletUtil.instanceWallet('test123')

      const flags = {
        msg: 'test message'
      }

      const result = await uut.sign(flags)

      assert.include(result.msg, 'test message')
    })

    it('should catch, report, and throw errors', async () => {
      try {
        await uut.sign()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'read properties')
      }
    })
  })

  describe('#validateFlags()', () => {
    it('validateFlags() should return true if all arguments are supplied.', () => {
      const flags = {
        name: 'test123',
        msg: 'test message'
      }

      assert.equal(uut.validateFlags(flags), true, 'return true')
    })

    it('validateFlags() should throw error if name is not supplied.', () => {
      try {
        uut.validateFlags({})

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet name with the -n flag',
          'Expected error message.'
        )
      }
    })

    it('validateFlags() should throw error if msg is not supplied', () => {
      try {
        const flags = {
          name: 'test123'
        }
        uut.validateFlags(flags)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a message to sign with the -m flag.',
          'Expected error message.'
        )
      }
    })
  })

  describe('#run', () => {
    it('should execute the run function', async () => {
      const flags = {
        name: 'test123',
        msg: 'test message'
      }

      const result = await uut.run(flags)

      assert.equal(result, true)
    })

    it('should handle an error', async () => {
      const result = await uut.run()

      assert.equal(result, 0)
    })
  })
})

```

`/home/trout/work/psf/code/psf-slp-wallet/test/unit/commands/token-create-nft.unit.js`:

```js
/*
Unit tests for the token-create-nft command.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import TokenCreateNFT from '../../../src/commands/token-create-nft.js'
import MinimalSlpWalletMock from '../../mocks/msw-mock.js'
import WalletCreate from '../../../src/commands/wallet-create.js'
const walletCreate = new WalletCreate()

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#token-create-nft', () => {
  let uut
  let sandbox
  let mockWallet

  before(async () => {
    await walletCreate.createWallet(filename)
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new TokenCreateNFT()
    mockWallet = new MinimalSlpWalletMock()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    await fs.rm(filename)
  })

  describe('#validateFlags()', () => {
    it('should return true if all arguments are included', () => {
      const flags = {
        walletName: 'test123',
        tokenName: 'test',
        ticker: 'TST',
        tokenId: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684'
      }

      assert.equal(uut.validateFlags(flags), true, 'return true')
    })

    it('should throw error if wallet name is not supplied.', () => {
      try {
        const flags = {}
        uut.validateFlags(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet name with the -n flag.',
          'Expected error message.'
        )
      }
    })

    it('should throw error if token name is not supplied.', () => {
      try {
        const flags = {
          walletName: 'test123'
        }
        uut.validateFlags(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a name for the token with the -m flag.',
          'Expected error message.'
        )
      }
    })

    it('should throw error if token ticker is not supplied.', () => {
      try {
        const flags = {
          walletName: 'test123',
          tokenName: 'test'
        }
        uut.validateFlags(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a ticker for the token with the -t flag.',
          'Expected error message.'
        )
      }
    })
    it('should throw error if group tokenId is not supplied.', () => {
      try {
        const flags = {
          walletName: 'test123',
          tokenName: 'test',
          ticker: 'TST'
        }
        uut.validateFlags(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a tokenId ( Group token to burn ) for the NFT with the -i flag',
          'Expected error message.'
        )
      }
    })
  })

  describe('#openWallet', () => {
    it('should return an instance of the wallet', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

      const flags = {
        walletName: 'test123'
      }

      const result = await uut.openWallet(flags)
      // console.log('result: ', result)

      assert.property(result, 'walletInfoPromise')
    })
  })

  describe('#generateTokenTx', () => {
    it('should generate a hex transaction', async () => {
      // Mock data
      const bchUtxo = {
        height: 744046,
        tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        tx_pos: 3,
        value: 577646,
        txid: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        vout: 3,
        address: 'bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h',
        isSlp: false,
        satoshis: 577646
      }

      const flags = {
        walletName: 'test123',
        tokenName: 'test',
        ticker: 'TST',
        tokenId: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684'
      }

      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

      // Instantiate the wallet and bch-js
      await uut.openWallet(flags)

      // Force UTXOs:
      uut.wallet.utxos.utxoStore = {
        bchUtxos: [bchUtxo],
        slpUtxos: {
          group: {
            tokens: [{
              tokenId: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
              tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
              tx_pos: 4,
              value: 546,
              tokenType: 129,
              utxoType: 'group',
              decimals: 0
            }]
          }
        }
      }

      const result = await uut.generateTokenTx(flags)
      // console.log('result: ', result)

      assert.include(result, '020000000')
    })

    it('should throw an error if there are no BCH UTXOs to pay for tx', async () => {
      try {
        const flags = {
          walletName: 'test123'
        }

        // Mock dependencies and force desired code path
        sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

        // Instantiate the wallet and bch-js
        await uut.openWallet(flags)

        // Force bchUtxo.
        uut.wallet.utxos.utxoStore.bchUtxos = []

        await uut.generateTokenTx(flags)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'No BCH UTXOs available to pay for transaction.')
      }
    })

    it('should work with fully-hydrated flags object', async () => {
      // Mock data
      const bchUtxo = {
        height: 744046,
        tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        tx_pos: 3,
        value: 577646,
        txid: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        vout: 3,
        address: 'bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h',
        isSlp: false,
        satoshis: 577646
      }

      const flags = {
        walletName: 'test123',
        tokenName: 'test',
        ticker: 'TST',
        url: 'test url',
        hash: '7a427a156fe70f83d3ccdd17e75804cc0df8c95c64ce04d256b3851385002a0b',
        tokenId: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684'
      }

      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

      // Instantiate the wallet and bch-js
      await uut.openWallet(flags)

      // Force UTXOs:
      uut.wallet.utxos.utxoStore = {
        bchUtxos: [bchUtxo],
        slpUtxos: {
          group: {
            tokens: [{
              tokenId: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
              tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
              tx_pos: 4,
              value: 546,
              tokenType: 129,
              utxoType: 'group',
              decimals: 0
            }]
          }
        }
      }

      const result = await uut.generateTokenTx(flags)
      // console.log('result: ', result)

      assert.include(result, '020000000')
    })

    it('should throw an error if there are no Group UTXOs', async () => {
      try {
        const flags = {
          walletName: 'test123',
          tokenName: 'test',
          ticker: 'TST',
          tokenId: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684'
        }

        // Mock dependencies and force desired code path
        sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

        // Instantiate the wallet and bch-js
        await uut.openWallet(flags)

        const bchUtxo = {
          height: 744046,
          tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
          tx_pos: 3,
          value: 577646,
          txid: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
          vout: 3,
          address: 'bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h',
          isSlp: false,
          satoshis: 577646
        }

        // Force UTXOs:
        uut.wallet.utxos.utxoStore = {
          bchUtxos: [bchUtxo],
          slpUtxos: {
            group: {
              tokens: []
            }
          }
        }

        await uut.generateTokenTx(flags)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'Group token with token ID')
      }
    })
  })

  describe('#run', () => {
    it('should execute the run function', async () => {
      // Mock dependencies
      uut.wallet = new MinimalSlpWalletMock()
      sandbox.stub(uut, 'validateFlags').returns(true)
      sandbox.stub(uut, 'openWallet').resolves(mockWallet)
      sandbox.stub(uut, 'generateTokenTx').resolves('fake-hex')

      const result = await uut.run({})

      assert.equal(result, true)
    })

    it('should handle an error', async () => {
      const result = await uut.run()

      assert.equal(result, 0)
    })
  })
})

```

`/home/trout/work/psf/code/psf-slp-wallet/test/unit/commands/wallet-sweep.unit.js`:

```js
/*
  Unit tests for the wallet-sweep command.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import WalletCreate from '../../../src/commands/wallet-create.js'
import WalletUtil from '../../../src/lib/wallet-util.js'
import WalletSweep from '../../../src/commands/wallet-sweep.js'

const walletCreate = new WalletCreate()
const walletUtil = new WalletUtil()

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#wallet-sweep', () => {
  let uut
  let sandbox

  before(async () => {
    await walletCreate.createWallet(filename)
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new WalletSweep()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    await fs.rm(filename)
  })

  describe('#sweepWif', () => {
    it('should sweep funds from a private key', async () => {
      // Instantiate the minimal-slp-wallet
      uut.bchWallet = await walletUtil.instanceWallet('test123')

      // Mock dependencies
      class MockSweepLib {
        populateObjectFromNetwork () {}
        async sweepTo () {}
      }
      uut.BchTokenSweep = MockSweepLib
      sandbox.stub(uut.bchWallet.ar, 'sendTx').resolves('fake-txid')

      const flags = {
        wif: 'Kzq8EEyjkXGzDmBbWxHWY8bxayxXawVDmrnmgq7JQmhRgMCrorfj',
        name: 'test123'
      }

      const result = await uut.sweepWif(flags)

      assert.equal(result, 'fake-txid')
    })

    it('should catch, report, and throw errors', async () => {
      try {
        await uut.sweepWif()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'read properties')
      }
    })
  })

  describe('#validateFlags()', () => {
    it('validateFlags() should return true if all arguments are supplied.', () => {
      const flags = {
        name: 'test123',
        wif: 'Kzq8EEyjkXGzDmBbWxHWY8bxayxXawVDmrnmgq7JQmhRgMCrorfj'
      }

      assert.equal(uut.validateFlags(flags), true, 'return true')
    })

    it('validateFlags() should throw error if name is not supplied.', () => {
      try {
        uut.validateFlags({})

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet name with the -n flag',
          'Expected error message.'
        )
      }
    })

    it('validateFlags() should throw error if wif is not supplied.', () => {
      try {
        const flags = {
          name: 'test123'
        }
        uut.validateFlags(flags)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a private key to sweep with the -w flag.',
          'Expected error message.'
        )
      }
    })
  })

  describe('#run', () => {
    it('should execute the run function', async () => {
      // Mock dependencies
      sandbox.stub(uut, 'sweepWif').resolves('fake-txid')

      const flags = {
        name: 'test123',
        wif: 'Kzq8EEyjkXGzDmBbWxHWY8bxayxXawVDmrnmgq7JQmhRgMCrorfj'
      }

      const result = await uut.run(flags)

      assert.equal(result, true)
    })

    it('should handle an error', async () => {
      const result = await uut.run()

      assert.equal(result, 0)
    })
  })
})

```

`/home/trout/work/psf/code/psf-slp-wallet/test/unit/commands/wallet-balance.unit.js`:

```js
/*
  Unit tests for the wallet-balance command.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import WalletCreate from '../../../src/commands/wallet-create.js'
import BchWalletMock from '../../mocks/msw-mock.js'
import WalletBalance from '../../../src/commands/wallet-balance.js'
import WalletServiceMock from '../../mocks/wallet-service-mock.js'
const walletCreate = new WalletCreate()

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#wallet-balance', () => {
  let uut
  let sandbox

  before(async () => {
    await walletCreate.createWallet(filename)
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new WalletBalance()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    await fs.rm(filename)
  })

  describe('#displayBalance', () => {
    it('should display wallet balances', () => {
      const mockWallet = new BchWalletMock()
      // console.log('mockWallet: ', mockWallet)

      const result = uut.displayBalance(mockWallet)

      assert.equal(result, true)
    })

    it('should display verbose UTXO data when flag is set', () => {
      const mockWallet = new BchWalletMock()
      // console.log('mockWallet: ', mockWallet)

      const flags = {
        verbose: true
      }

      const result = uut.displayBalance(mockWallet, flags)

      assert.equal(result, true)
    })

    it('should catch and throw errors', () => {
      try {
        uut.displayBalance()

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log(err)
        assert.include(err.message, 'Cannot read prop')
      }
    })

    it('should display minting batons', () => {
      const mockWallet = new BchWalletMock()
      // console.log('mockWallet: ', mockWallet)

      // Force UTXOs
      mockWallet.utxos.utxoStore = {
        bchUtxos: [{
          height: 744046,
          tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
          tx_pos: 3,
          value: 577646,
          txid: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
          vout: 3,
          address: 'bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h',
          isSlp: false,
          satoshis: 577646
        }],
        slpUtxos: {
          type1: {
            tokens: [],
            mintBatons: []
          },
          group: {
            tokens: [],
            mintBatons: [{
              tokenId: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
              tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
              tx_pos: 4,
              value: 546,
              tokenType: 129,
              utxoType: 'group',
              decimals: 0
            }]
          },
          nft: {
            tokens: []
          }
        }
      }

      const result = uut.displayBalance(mockWallet)

      assert.equal(result, true)
    })
  })

  describe('#getBalances', () => {
    it('should return wallet instance with updated UTXOs', async () => {
      // Mock dependencies
      uut.walletService = new WalletServiceMock()
      uut.bchWallet = new BchWalletMock()

      const result = await uut.getBalances()
      // console.log('result: ', result)

      assert.property(result, 'walletInfo')
      assert.property(result, 'utxos')
      assert.property(result.utxos, 'utxoStore')
    })

    it('should catch and throw errors', async () => {
      try {
        await uut.getBalances()

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'read properties')
      }
    })
  })

  describe('#validateFlags()', () => {
    it('validateFlags() should return true if name is supplied.', () => {
      assert.equal(uut.validateFlags({ name: 'test' }), true, 'return true')
    })

    it('validateFlags() should throw error if name is not supplied.', () => {
      try {
        uut.validateFlags({})
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet name with the -n flag',
          'Expected error message.'
        )
      }
    })
  })

  describe('#run', () => {
    it('should execute the run function', async () => {
      // Mock dependencies
      sandbox.stub(uut, 'getBalances').resolves({})
      sandbox.stub(uut, 'displayBalance').resolves({})
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(new BchWalletMock())

      const flags = {
        name: 'test123'
      }

      const result = await uut.run(flags)

      assert.equal(result, true)
    })

    it('should handle an error without a message', async () => {
      const result = await uut.run()

      assert.equal(result, 0)
    })
  })
})

```

`/home/trout/work/psf/code/psf-slp-wallet/test/unit/commands/token-mda-tx.unit.js`:

```js
/*
Unit tests for the token-mda-tx command.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import TokenMdaTx from '../../../src/commands/token-mda-tx.js'
import MinimalSlpWalletMock from '../../mocks/msw-mock.js'
import WalletCreate from '../../../src/commands/wallet-create.js'
const walletCreate = new WalletCreate()

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#token-mint', () => {
  let uut
  let sandbox
  let mockWallet

  before(async () => {
    await walletCreate.createWallet(filename)
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new TokenMdaTx()
    mockWallet = new MinimalSlpWalletMock()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    await fs.rm(filename)
  })

  describe('#validateFlags()', () => {
    it('should return true if all arguments are included', () => {
      const flags = {
        walletName: 'test123',
        mda: 'bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h'
      }

      assert.equal(uut.validateFlags(flags), true, 'return true')
    })

    it('should throw error if wallet name is not supplied.', () => {
      try {
        const flags = {}
        uut.validateFlags(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet name with the -n flag.',
          'Expected error message.'
        )
      }
    })

    it('should throw error if  mda is not supplied.', () => {
      try {
        const flags = {
          walletName: 'test123'
        }
        uut.validateFlags(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a mutable data address with the -a flag.',
          'Expected error message.'
        )
      }
    })

    it('should throw error if MDA is not a valid BCH address', () => {
      try {
        const flags = {
          walletName: 'test123',
          mda: 'invalid-address'
        }
        uut.validateFlags(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Unsupported address format')
      }
    })
  })

  describe('#openWallet', () => {
    it('should return an instance of the wallet', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

      const flags = {
        walletName: 'test123'
      }

      const result = await uut.openWallet(flags)
      // console.log('result: ', result)

      assert.property(result, 'walletInfoPromise')
    })
  })

  describe('#generateMdaTx', () => {
    it('should generate a hex transaction', async () => {
      // Mock data
      const bchUtxo = {
        height: 744046,
        tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        tx_pos: 3,
        value: 577646,
        txid: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        vout: 3,
        address: 'bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h',
        isSlp: false,
        satoshis: 577646
      }

      const flags = {
        walletName: 'test123',
        mda: 'bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h'
      }

      // Mock dependencies and force desired code path.
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

      // Instantiate the wallet and bch-js
      await uut.openWallet(flags)

      // Force UTXOs:
      uut.wallet.utxos.utxoStore = {
        bchUtxos: [bchUtxo],
        slpUtxos: {
          type1: {
            mintBatons: []
          },
          group: {
            mintBatons: []
          }
        }
      }

      const result = await uut.generateMdaTx(flags)
      // console.log('result: ', result)

      assert.include(result, '020000000')
    })

    it('should throw an error if there are no BCH UTXOs to pay for tx', async () => {
      try {
        const flags = {
          walletName: 'test123',
          mda: 'abc123'
        }

        // Mock dependencies and force desired code path.
        sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

        // Instantiate the wallet and bch-js
        await uut.openWallet(flags)

        // Force bchUtxo.
        uut.wallet.utxos.utxoStore.bchUtxos = []

        await uut.generateMdaTx(flags)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'No BCH UTXOs available to pay for transaction.')
      }
    })
  })

  describe('#displayData', () => {
    it('should display the final data', () => {
      const flags = {
        mda: 'address'
      }
      const result = uut.displayData(flags, 'tokenId')

      assert.equal(result, true)
    })
  })
  describe('#run', () => {
    it('should execute the run function', async () => {
      // Mock dependencies
      uut.wallet = new MinimalSlpWalletMock()
      sandbox.stub(uut, 'validateFlags').returns(true)
      sandbox.stub(uut, 'openWallet').resolves(mockWallet)
      sandbox.stub(uut, 'generateMdaTx').resolves('fake-hex')

      const result = await uut.run({})

      assert.equal(result, true)
    })

    it('should handle an error', async () => {
      const result = await uut.run()

      assert.equal(result, 0)
    })
  })
})

```

`/home/trout/work/psf/code/psf-slp-wallet/test/unit/commands/wallet-addrs.unit.js`:

```js
/*
  Unit tests for the wallet-addrs command
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import WalletCreate from '../../../src/commands/wallet-create.js'
import WalletAddrs from '../../../src/commands/wallet-addrs.js'
const walletCreate = new WalletCreate()

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#wallet-addrs', () => {
  let uut
  let sandbox

  before(async () => {
    await walletCreate.createWallet(filename)
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new WalletAddrs()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    await fs.rm(filename)
  })

  describe('#getAddrs', () => {
    it('should return wallet addresses', async () => {
      const result = await uut.getAddrs(filename)
      console.log('result: ', result)

      assert.property(result, 'cashAddress')
      assert.property(result, 'slpAddress')
      assert.property(result, 'legacyAddress')
    })

    it('should throw an error if wallet not found', async () => {
      try {
        await uut.getAddrs('wrong path')

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'no such file')
      }
    })
  })

  describe('#validateFlags()', () => {
    it('validateFlags() should return true if name is supplied.', () => {
      assert.equal(uut.validateFlags({ name: 'test' }), true, 'return true')
    })

    it('validateFlags() should throw error if name is not supplied.', () => {
      try {
        uut.validateFlags({})
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet name with the -n flag',
          'Expected error message.'
        )
      }
    })
  })

  describe('#run', () => {
    it('should execute the run function', async () => {
      const flags = {
        name: 'test123'
      }

      const result = await uut.run(flags)
      // console.log('result', result)
      assert.property(result, 'cashAddress')
      assert.property(result, 'slpAddress')
      assert.property(result, 'legacyAddress')
    })

    it('should handle an error without a name', async () => {
      const result = await uut.run({})

      assert.equal(result, 0)
    })
  })
})

```

`/home/trout/work/psf/code/psf-slp-wallet/test/unit/commands/wallet-create.unit.js`:

```js
/*
  Unit tests for the wallet-create command.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import WalletCreate from '../../../src/commands/wallet-create.js'
import BchWalletMock from '../../mocks/msw-mock.js'

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#wallet-create', () => {
  let uut
  let sandbox

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new WalletCreate()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#createWallet()', () => {
    it('should exit with error status if called without a filename.', async () => {
      try {
        await uut.createWallet(undefined, undefined)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(
          err.message,
          'filename required.',
          'Should throw expected error.'
        )
      }
    })

    it('should create a mainnet wallet file with the given name', async () => {
      // Mock dependencies
      uut.BchWallet = BchWalletMock

      const walletData = await uut.createWallet(filename)
      // console.log(`walletData: ${JSON.stringify(walletData, null, 2)}`)

      assert.property(walletData, 'mnemonic')
      assert.property(walletData, 'privateKey')
      assert.property(walletData, 'publicKey')
      assert.property(walletData, 'address')
      assert.property(walletData, 'cashAddress')
      assert.property(walletData, 'slpAddress')
      assert.property(walletData, 'legacyAddress')
      assert.property(walletData, 'hdPath')
      assert.property(walletData, 'description')

      // Clean up.
      await fs.rm(filename)
    })
  })

  describe('#validateFlags()', () => {
    it('validateFlags() should return true if name is supplied.', () => {
      assert.equal(uut.validateFlags({ name: 'test' }), true, 'return true')
    })

    it('validateFlags() should throw error if name is not supplied.', () => {
      try {
        uut.validateFlags({})
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet name with the -n flag',
          'Expected error message.'
        )
      }
    })
  })

  describe('#run()', () => {
    it('should create the wallet with expected properties', async () => {
      // Mock dependencies
      uut.BchWallet = BchWalletMock

      const flags = {
        name: 'test123'
      }
      // Mock methods that will be tested elsewhere.
      // sandbox.stub(uut, 'parse').returns({ flags })

      const walletData = await uut.run(flags)
      // console.log('walletData: ', walletData)

      assert.property(walletData, 'mnemonic')
      assert.property(walletData, 'privateKey')
      assert.property(walletData, 'publicKey')
      assert.property(walletData, 'address')
      assert.property(walletData, 'cashAddress')
      assert.property(walletData, 'slpAddress')
      assert.property(walletData, 'legacyAddress')
      assert.property(walletData, 'hdPath')
      assert.property(walletData, 'description')

      // Clean up.
      await fs.rm(filename)
    })

    it('should add a description when provided', async () => {
      // Mock dependencies
      uut.BchWallet = BchWalletMock

      const flags = {
        name: 'test123',
        description: 'test'
      }
      // Mock methods that will be tested elsewhere.
      // sandbox.stub(uut, 'parse').returns({ flags })

      const walletData = await uut.run(flags)

      assert.property(walletData, 'mnemonic')
      assert.property(walletData, 'privateKey')
      assert.property(walletData, 'publicKey')
      assert.property(walletData, 'address')
      assert.property(walletData, 'cashAddress')
      assert.property(walletData, 'slpAddress')
      assert.property(walletData, 'legacyAddress')
      assert.property(walletData, 'hdPath')
      assert.property(walletData, 'description')

      // Clean up.
      await fs.rm(filename)
    })

    it('should return 0 on errors', async () => {
      const result = await uut.run({})

      assert.equal(result, 0)
    })
  })
})

```

`/home/trout/work/psf/code/psf-slp-wallet/test/unit/commands/wallet-list.unit.js`:

```js
/*
  Unit tests for the wallet-list command.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import WalletCreate from '../../../src/commands/wallet-create.js'
import WalletList from '../../../src/commands/wallet-list.js'

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#wallet-list', () => {
  let sandbox
  let uut

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new WalletList()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#parseWallets', () => {
    it('should correctly parse wallet data', async () => {
      // Create a mainnet wallet.
      const createWallet = new WalletCreate()
      await createWallet.createWallet(filename)

      const data = await uut.parseWallets()
      // console.log('data: ', data)

      // Find the wallet that was just created.
      const testWallet = data.find(wallet => wallet[0].indexOf('test123') > -1)
      // console.log('testWallet: ', testWallet)

      assert.include(testWallet[0], 'test123')

      // Clean up
      await fs.rm(filename)
    })

    it('should return empty array on missing wallets data', async () => {
      // Force shelljs.ls to return an empty array.
      sandbox.stub(uut.shelljs, 'ls').returns([])

      let data

      try {
        data = await uut.parseWallets()
      } catch (error) {
        assert.equal(data, [], 'Empty array')
        assert.equal(error, 'No wallets found.', 'Proper error message')
      }
    })
  })

  describe('#run', () => {
    it('should display wallets table', async () => {
      const createWallet = new WalletCreate()
      await createWallet.createWallet(filename, 'test wallet')

      // Promise.resolve(uut.run()).then(function (table) {
      //   assert.include(table, 'Name')
      //   assert.include(table, 'Balance (BCH)')
      // })

      sinon.stub(uut, 'parseWallets').resolves({})
      sandbox.stub(uut, 'displayTable').resolves('')

      // Clean up
      await fs.rm(filename)

      const result = await uut.run()

      assert.equal(result, true)
    })

    it('should return 0 on error', async () => {
      // Force an error
      sandbox.stub(uut, 'parseWallets').throws(new Error('test error'))

      const result = await uut.run()

      assert.equal(result, 0)
    })
  })

  describe('#displayTable', () => {
    it('should display the data in a console table', () => {
      const walletData = [
        [
          'msg1',
          'Used for sending and receiving messages'
        ],
        [
          'msg2',
          'Used for sending and receiving message'
        ]
      ]

      const tableStr = uut.displayTable(walletData)

      assert.isString(tableStr)
    })
  })
})

```

`/home/trout/work/psf/code/psf-slp-wallet/test/unit/commands/token-create-group.unit.js`:

```js
/*
Unit tests for the token-create-group command.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import TokenCreateGroup from '../../../src/commands/token-create-group.js'
import MinimalSlpWalletMock from '../../mocks/msw-mock.js'
import WalletCreate from '../../../src/commands/wallet-create.js'
const walletCreate = new WalletCreate()

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#token-create-group', () => {
  let uut
  let sandbox
  let mockWallet

  before(async () => {
    await walletCreate.createWallet(filename)
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new TokenCreateGroup()
    mockWallet = new MinimalSlpWalletMock()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    await fs.rm(filename)
  })

  describe('#validateFlags()', () => {
    it('should return true if all arguments are included', () => {
      const flags = {
        walletName: 'test123',
        tokenName: 'test',
        ticker: 'TST'
      }

      assert.equal(uut.validateFlags(flags), true, 'return true')
    })

    it('should throw error if wallet name is not supplied.', () => {
      try {
        const flags = {}
        uut.validateFlags(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet name with the -n flag.',
          'Expected error message.'
        )
      }
    })

    it('should throw error if token name is not supplied.', () => {
      try {
        const flags = {
          walletName: 'test123'
        }
        uut.validateFlags(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a name for the token with the -m flag.',
          'Expected error message.'
        )
      }
    })

    it('should throw error if token ticker is not supplied.', () => {
      try {
        const flags = {
          walletName: 'test123',
          tokenName: 'test'
        }
        uut.validateFlags(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a ticker for the token with the -t flag.',
          'Expected error message.'
        )
      }
    })
  })

  describe('#openWallet', () => {
    it('should return an instance of the wallet', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

      const flags = {
        walletName: 'test123'
      }

      const result = await uut.openWallet(flags)
      // console.log('result: ', result)

      assert.property(result, 'walletInfoPromise')
    })
  })

  describe('#generateTokenTx', () => {
    it('should generate a hex transaction', async () => {
      // Mock data
      const bchUtxo = {
        height: 744046,
        tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        tx_pos: 3,
        value: 577646,
        txid: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        vout: 3,
        address: 'bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h',
        isSlp: false,
        satoshis: 577646
      }

      const flags = {
        walletName: 'test123',
        tokenName: 'test',
        ticker: 'TST',
        qty: 1,
        url: 'test url',
        hash: '7a427a156fe70f83d3ccdd17e75804cc0df8c95c64ce04d256b3851385002a0b'
      }

      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

      // Instantiate the wallet and bch-js
      await uut.openWallet(flags)

      // Force bchUtxo.
      uut.wallet.utxos.utxoStore.bchUtxos = [bchUtxo]

      const result = await uut.generateTokenTx(flags)
      // console.log('result: ', result)

      assert.include(result, '020000000')
    })

    it('should throw an error if there are no BCH UTXOs to pay for tx', async () => {
      try {
        // Mock dependencies and force desired code path
        sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

        const flags = {
          walletName: 'test123'
        }

        // Instantiate the wallet and bch-js
        await uut.openWallet(flags)

        // Force bchUtxo.
        uut.wallet.utxos.utxoStore.bchUtxos = []

        await uut.generateTokenTx(flags)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'No BCH UTXOs available to pay for transaction.')
      }
    })

    it('should work with fully-hydrated flags object', async () => {
      // Mock data
      const bchUtxo = {
        height: 744046,
        tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        tx_pos: 3,
        value: 577646,
        txid: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        vout: 3,
        address: 'bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h',
        isSlp: false,
        satoshis: 577646
      }

      const flags = {
        walletName: 'test123',
        tokenName: 'test',
        ticker: 'TST',
        qty: 100,
        url: 'test url',
        hash: '7a427a156fe70f83d3ccdd17e75804cc0df8c95c64ce04d256b3851385002a0b'
      }

      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

      // Instantiate the wallet and bch-js
      await uut.openWallet(flags)

      // Force bchUtxo.
      uut.wallet.utxos.utxoStore.bchUtxos = [bchUtxo]

      const result = await uut.generateTokenTx(flags)
      // console.log('result: ', result)

      assert.include(result, '020000000')
    })
  })

  describe('#run', () => {
    it('should execute the run function', async () => {
      // Mock dependencies
      uut.wallet = new MinimalSlpWalletMock()
      sandbox.stub(uut, 'validateFlags').returns(true)
      sandbox.stub(uut, 'openWallet').resolves(mockWallet)
      sandbox.stub(uut, 'generateTokenTx').resolves('fake-hex')

      const result = await uut.run({})

      assert.equal(result, true)
    })

    it('should handle an error', async () => {
      const result = await uut.run()

      assert.equal(result, 0)
    })
  })
})

```

`/home/trout/work/psf/code/psf-slp-wallet/test/unit/commands/send-bch.unit.js`:

```js
/*
  Unit tests for send-bch command.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import WalletCreate from '../../../src/commands/wallet-create.js'
import WalletUtil from '../../../src/lib/wallet-util.js'
import SendBch from '../../../src/commands/send-bch.js'

const walletCreate = new WalletCreate()
const walletUtil = new WalletUtil()

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#send-bch', () => {
  let uut
  let sandbox

  before(async () => {
    await walletCreate.createWallet(filename)
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new SendBch()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    await fs.rm(filename)
  })

  describe('#send-bch', () => {
    it('should send BCH to provided address', async () => {
      // Instantiate the minimal-slp-wallet
      uut.bchWallet = await walletUtil.instanceWallet('test123')

      // Mock the wallet functions so we don't make network calls.
      sandbox.stub(uut.bchWallet, 'initialize').resolves()
      sandbox.stub(uut.bchWallet, 'getBalance').resolves(0.1)
      sandbox.stub(uut.bchWallet, 'send').resolves('fake-txid')

      const flags = {
        name: 'test123',
        qty: 0.01,
        addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl'
      }

      const result = await uut.sendBch(flags)

      assert.equal(result, 'fake-txid')
    })

    it('should throw error if wallet balance is less than quanity to send', async () => {
      try {
        // Instantiate the minimal-slp-wallet
        uut.bchWallet = await walletUtil.instanceWallet('test123')

        // Mock the wallet functions so we don't make network calls.
        sandbox.stub(uut.bchWallet, 'initialize').resolves()
        sandbox.stub(uut.bchWallet, 'getBalance').resolves(0.1)
        sandbox.stub(uut.bchWallet, 'send').resolves('fake-txid')

        const flags = {
          name: 'test123',
          qty: 1,
          addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl'
        }

        await uut.sendBch(flags)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Insufficient funds.')
      }
    })
  })

  describe('#validateFlags()', () => {
    it('validateFlags() should return true if all arguments are supplied.', () => {
      const flags = {
        name: 'test123',
        qty: 1,
        addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl'
      }

      assert.equal(uut.validateFlags(flags), true, 'return true')
    })

    it('validateFlags() should throw error if name is not supplied.', () => {
      try {
        uut.validateFlags({})

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet name with the -n flag',
          'Expected error message.'
        )
      }
    })

    it('validateFlags() should throw error if addr is not supplied.', () => {
      try {
        const flags = {
          name: 'test123'
        }
        uut.validateFlags(flags)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a receiver address with the -a flag.',
          'Expected error message.'
        )
      }
    })

    it('validateFlags() should throw error if qty is not supplied.', () => {
      try {
        const flags = {
          name: 'test123',
          addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl'
        }
        uut.validateFlags(flags)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a quantity in BCH with the -q flag.',
          'Expected error message.'
        )
      }
    })
  })

  describe('#run', () => {
    it('should execute the run function', async () => {
      // Mock dependencies
      sandbox.stub(uut, 'sendBch').resolves('fake-txid')

      const flags = {
        name: 'test123',
        qty: 0.01,
        addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl'
      }

      const result = await uut.run(flags)

      assert.equal(result, true)
    })

    it('should handle an error', async () => {
      const result = await uut.run()

      assert.equal(result, 0)
    })
  })
})

```

`/home/trout/work/psf/code/psf-slp-wallet/test/unit/commands/token-create-fungible.unit.js`:

```js
/*
Unit tests for the token-create-fungible command.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import TokenCreateFungible from '../../../src/commands/token-create-fungible.js'
import MinimalSlpWalletMock from '../../mocks/msw-mock.js'
import WalletCreate from '../../../src/commands/wallet-create.js'
const walletCreate = new WalletCreate()

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#token-create-fungible', () => {
  let uut
  let sandbox
  let mockWallet

  before(async () => {
    await walletCreate.createWallet(filename)
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new TokenCreateFungible()
    mockWallet = new MinimalSlpWalletMock()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    await fs.rm(filename)
  })

  describe('#validateFlags()', () => {
    it('should return true if all arguments are included', () => {
      const flags = {
        walletName: 'test123',
        tokenName: 'test',
        ticker: 'TST',
        decimals: '2',
        qty: 100
      }

      assert.equal(uut.validateFlags(flags), true, 'return true')
    })

    it('should throw error if wallet name is not supplied.', () => {
      try {
        const flags = {}
        uut.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet name with the -n flag.',
          'Expected error message.'
        )
      }
    })

    it('should throw error if token name is not supplied.', () => {
      try {
        const flags = {
          walletName: 'test123'
        }
        uut.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a name for the token with the -m flag.',
          'Expected error message.'
        )
      }
    })

    it('should throw error if token ticker is not supplied.', () => {
      try {
        const flags = {
          walletName: 'test123',
          tokenName: 'test'
        }
        uut.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a ticker for the token with the -t flag.',
          'Expected error message.'
        )
      }
    })

    it('should throw error if token decimals are not supplied.', () => {
      try {
        const flags = {
          walletName: 'test123',
          tokenName: 'test',
          ticker: 'TST'
        }
        uut.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify the decimals of the token the -d flag.',
          'Expected error message.'
        )
      }
    })

    it('should throw error if token quantity are not supplied.', () => {
      try {
        const flags = {
          walletName: 'test123',
          tokenName: 'test',
          ticker: 'TST',
          decimals: 2
        }
        uut.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a quantity of tokens to create with the -q flag.',
          'Expected error message.'
        )
      }
    })
  })

  describe('#openWallet', () => {
    it('should return an instance of the wallet', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

      const flags = {
        walletName: 'test123'
      }

      const result = await uut.openWallet(flags)
      // console.log('result: ', result)

      assert.property(result, 'walletInfoPromise')
    })
  })

  describe('#generateTokenTx', () => {
    it('should generate a hex transaction', async () => {
      // Mock data
      const bchUtxo = {
        height: 744046,
        tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        tx_pos: 3,
        value: 577646,
        txid: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        vout: 3,
        address: 'bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h',
        isSlp: false,
        satoshis: 577646
      }

      const flags = {
        walletName: 'test123',
        tokenName: 'test',
        ticker: 'TST',
        decimals: '2',
        qty: 100
      }

      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

      // Instantiate the wallet and bch-js
      await uut.openWallet(flags)

      // Force bchUtxo.
      uut.wallet.utxos.utxoStore.bchUtxos = [bchUtxo]

      const result = await uut.generateTokenTx(flags)
      // console.log('result: ', result)

      assert.include(result, '020000000')
    })

    it('should throw an error if there are no BCH UTXOs to pay for tx', async () => {
      try {
        // Mock dependencies and force desired code path
        sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

        const flags = {
          walletName: 'test123'
        }

        // Instantiate the wallet and bch-js
        await uut.openWallet(flags)

        // Force bchUtxo.
        uut.wallet.utxos.utxoStore.bchUtxos = []

        await uut.generateTokenTx(flags)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'No BCH UTXOs available to pay for transaction.')
      }
    })

    it('should work with fully-hydrated flags object', async () => {
      // Mock data
      const bchUtxo = {
        height: 744046,
        tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        tx_pos: 3,
        value: 577646,
        txid: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        vout: 3,
        address: 'bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h',
        isSlp: false,
        satoshis: 577646
      }

      const flags = {
        walletName: 'test123',
        tokenName: 'test',
        ticker: 'TST',
        decimals: '2',
        qty: 100,
        baton: 2,
        url: 'test url',
        hash: '7a427a156fe70f83d3ccdd17e75804cc0df8c95c64ce04d256b3851385002a0b'
      }

      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

      // Instantiate the wallet and bch-js
      await uut.openWallet(flags)

      // Force bchUtxo.
      uut.wallet.utxos.utxoStore.bchUtxos = [bchUtxo]

      const result = await uut.generateTokenTx(flags)
      // console.log('result: ', result)

      assert.include(result, '020000000')
    })
  })

  describe('#run', () => {
    it('should execute the run function', async () => {
      // Mock dependencies
      uut.wallet = new MinimalSlpWalletMock()
      sandbox.stub(uut, 'validateFlags').returns(true)
      sandbox.stub(uut, 'openWallet').resolves(mockWallet)
      sandbox.stub(uut, 'generateTokenTx').resolves('fake-hex')

      const result = await uut.run({})

      assert.equal(result, true)
    })

    it('should handle an error', async () => {
      const result = await uut.run()

      assert.equal(result, 0)
    })
  })
})

```

`/home/trout/work/psf/code/psf-slp-wallet/test/unit/commands/token-tx-history.unit.js`:

```js
/*
Unit tests for the token-tx-history command
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Local libraries
import TokenTxHistory from '../../../src/commands/token-tx-history.js'
import WalletServiceMock from '../../mocks/wallet-service-mock.js'

describe('#token-tx-history', () => {
  let uut
  let sandbox

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new TokenTxHistory()
    uut.BchWallet = WalletServiceMock
    uut.wallet = new WalletServiceMock()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags()', () => {
    it('should return true if all arguments are included', () => {
      const flags = { tokenId: 'abc123' }

      assert.equal(uut.validateFlags(flags), true, 'return true')
    })

    it('should throw error if tokenId is not supplied.', () => {
      try {
        const flags = {}
        uut.validateFlags(flags)
      } catch (err) {
        assert.include(err.message, 'You must specify a token ID with the -t flag', 'Expected error message.')
      }
    })
  })

  describe('#getTxHistory', () => {
    it('should get token data', async () => {
      // Mock wallet library
      const flags = { tokenId: 'abc123' }

      sandbox.stub(uut.wallet, 'getTokenData').resolves({
        genesisData: {
          txs: []
        }
      })
      const result = await uut.getTxHistory(flags)
      // console.log(result)

      assert.isArray(result)
    })
    it('should handle request error', async () => {
      try {
        const flags = { tokenId: 'abc123' }

        sandbox.stub(uut.wallet, 'getTokenData').throws(new Error('test error'))
        await uut.getTxHistory(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#displayTxHistory', () => {
    it('should display the final data', () => {
      const allData = {
        transactions: []
      }

      const result = uut.displayData(allData)

      assert.equal(result, true)
    })
  })

  describe('#run', () => {
    it('should execute the run function', async () => {
      // Mock dependencies
      sandbox.stub(uut, 'validateFlags').returns(true)
      sandbox.stub(uut, 'getTxHistory').resolves({})
      sandbox.stub(uut, 'displayData').returns(true)

      const result = await uut.run()

      assert.equal(result, true)
    })

    it('should handle an error', async () => {
      const result = await uut.run()

      assert.equal(result, 0)
    })
  })
})

```

`/home/trout/work/psf/code/psf-slp-wallet/test/mocks/msw-mock.js`:

```js
/*
  A mock file for minimal-slp-wallet
*/

import BCHJS from '@psf/bch-js'

class BchWallet {
  constructor () {
    this.walletInfoPromise = true

    this.walletInfo = {
      mnemonic:
        'rebel congress piece seat virtual tongue curious leader glass cute either moral',
      privateKey: 'L1fqtLVmksSdUZPcMgpUGMkBmMYGjJQe8dbqhkD8s16eBKCYTYpH',
      publicKey:
        '02acad5d4f1ad0c03e016639a98d8beebb3939e0e29529dcab916dab3b23c47e6f',
      cashAddress: 'bitcoincash:qp65erjld4jetgzwgvh6sxkyay97cl6gfyxue46uey',
      address: 'bitcoincash:qp65erjld4jetgzwgvh6sxkyay97cl6gfyxue46uey',
      slpAddress: 'simpleledger:qp65erjld4jetgzwgvh6sxkyay97cl6gfy28jw0u86',
      legacyAddress: '1BhDmfBRALFVZ4zryxDXNz8xJMxadyZD7k',
      hdPath: "m/44'/245'/0'/0/0",
      description: ''
    }

    this.bchjs = new BCHJS()

    // Environment variable is used by wallet-balance.unit.js to force an error.
    if (process.env.NO_UTXO) {
      this.utxos = {}
    } else {
      this.utxos = {
        utxoStore: {
          address: 'bitcoincash:qqetvdnlt0p8g27dr44cx7h057kpzly9xse9huc97z',
          bchUtxos: [
            {
              height: 700685,
              tx_hash:
                '1fc577caaff5626a8477162581e57bae1b19dc6aa6c10638013c2b1ba14dc654',
              tx_pos: 0,
              value: 1000,
              txid: '1fc577caaff5626a8477162581e57bae1b19dc6aa6c10638013c2b1ba14dc654',
              vout: 0,
              isValid: false
            },
            {
              height: 700685,
              tx_hash:
                '1fc577caaff5626a8477162581e57bae1b19dc6aa6c10638013c2b1ba14dc654',
              tx_pos: 2,
              value: 19406,
              txid: '1fc577caaff5626a8477162581e57bae1b19dc6aa6c10638013c2b1ba14dc654',
              vout: 2,
              isValid: false
            }
          ],
          nullUtxos: [],
          slpUtxos: {
            type1: {
              mintBatons: [],
              tokens: [
                {
                  height: 700522,
                  tx_hash:
                    'bb5691b50930816be78dad76d203a1c97ac94c03f6051b2fa0159c71c43aa3d0',
                  tx_pos: 1,
                  value: 546,
                  txid: 'bb5691b50930816be78dad76d203a1c97ac94c03f6051b2fa0159c71c43aa3d0',
                  vout: 1,
                  utxoType: 'token',
                  transactionType: 'send',
                  tokenId:
                    'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
                  tokenTicker: 'TROUT',
                  tokenName: "Trout's test token",
                  tokenDocumentUrl: 'troutsblog.com',
                  tokenDocumentHash: '',
                  decimals: 2,
                  tokenType: 1,
                  isValid: true,
                  tokenQty: '4.25'
                },
                {
                  height: 0,
                  tx_hash:
                    'c0ac066ce6efa1fa4763bf85a91c738e57c12b8765731bd07f0d8f5a55ce582f',
                  tx_pos: 1,
                  value: 546,
                  txid: 'c0ac066ce6efa1fa4763bf85a91c738e57c12b8765731bd07f0d8f5a55ce582f',
                  vout: 1,
                  utxoType: 'token',
                  transactionType: 'send',
                  tokenId:
                    '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0',
                  tokenTicker: 'PSF',
                  tokenName: 'Permissionless Software Foundation',
                  tokenDocumentUrl: 'psfoundation.cash',
                  tokenDocumentHash: '',
                  decimals: 8,
                  tokenType: 1,
                  isValid: true,
                  tokenQty: '1'
                }
              ]
            },
            nft: {
              tokens: []
            },
            group: {
              tokens: [],
              mintBatons: []
            }
          }
        }
      }
    }

    this.ar = {
      sendTx: async () => 'fake-txid'
    }
  }

  async getUtxos () {
    return {}
  }

  async initialize () {
    return true
  }

  async getTxData () {
    return true
  }

  async burnAll () {
    return true
  }

  async burnTokens () {
    return true
  }

  async optimize () {
    return true
  }

  async getPubKey () {
    return true
  }

  async sendTokens () {
    return true
  }

  async broadcast () {
    return true
  }
}

// module.exports = BchWallet

export default BchWallet

```

`/home/trout/work/psf/code/psf-slp-wallet/test/mocks/wallet-service-mock.js`:

```js
/*
  A mocked version of the wallet-service.js library.
  This mock does not make network calls, but returns hard-coded data for tests.
*/

class WalletService {
  checkServiceId () {
    return 'serviceId'
  }

  async getBalances (addrs) {
    return {}
  }

  async getUtxos (addr) {
    return {}
  }

  async sendTx (hex) {
    return {}
  }

  async getTokenData () {
    return {}
  }

  async cid2json () {
    return {}
  }
}

// module.exports = WalletService
export default WalletService

```

`/home/trout/work/psf/code/psf-slp-wallet/psf-slp-wallet.js`:

```js
/*
  This is the primary entry point for the psf-bch-wallet CLI app.
  This app uses commander.js.
*/

// Global npm libraries
import { Command } from 'commander'

// Local libraries
import WalletCreate from './src/commands/wallet-create.js'
import WalletList from './src/commands/wallet-list.js'
import WalletAddrs from './src/commands/wallet-addrs.js'
import WalletBalance from './src/commands/wallet-balance.js'
import SendBch from './src/commands/send-bch.js'
import SendTokens from './src/commands/send-tokens.js'
import WalletSweep from './src/commands/wallet-sweep.js'
import MsgSign from './src/commands/msg-sign.js'
import MsgVerify from './src/commands/msg-verify.js'
import TokenInfo from './src/commands/token-info.js'
import TokenTxHistory from './src/commands/token-tx-history.js'
import TokenCreateFungible from './src/commands/token-create-fungible.js'
import TokenCreateGroup from './src/commands/token-create-group.js'
import TokenCreateNFT from './src/commands/token-create-nft.js'
import TokenMint from './src/commands/token-mint.js'
import TokenMdaTx from './src/commands/token-mda-tx.js'

// Instantiate the subcommands
const walletCreate = new WalletCreate()
const walletList = new WalletList()
const walletAddrs = new WalletAddrs()
const walletBalance = new WalletBalance()
const sendBch = new SendBch()
const sendTokens = new SendTokens()
const walletSweep = new WalletSweep()
const msgSign = new MsgSign()
const msgVerify = new MsgVerify()
const tokenInfo = new TokenInfo()
const program = new Command()
const tokenTxHistory = new TokenTxHistory()
const tokenCreateFungible = new TokenCreateFungible()
const tokenCreateGroup = new TokenCreateGroup()
const tokenCreateNFT = new TokenCreateNFT()
const tokenMint = new TokenMint()
const tokenMdaTx = new TokenMdaTx()

program
  // Define the psf-bch-wallet app options
  .name('psf-slp-wallet')
  .description('A command-line BCH and SLP token wallet.')

// Define the wallet-create command
program
  .command('wallet-create')
  .description('Create a new wallet with name (-n <name>) and description (-d)')
  .option('-n, --name <string>', 'wallet name')
  .option('-d --description <string>', 'what the wallet is being used for')
  .action(walletCreate.run)

// Define the wallet-list command
program
  .command('wallet-list')
  .description('List existing wallets')
  .action(walletList.run)

program
  .command('wallet-addrs')
  .description('List the different addresses for a wallet.')
  .option('-n, --name <string>', 'wallet name')
  .action(walletAddrs.run)

program
  .command('wallet-balance')
  .description('Get balances in BCH and SLP tokens held by the wallet.')
  .option('-n, --name <string>', 'wallet name')
  .action(walletBalance.run)

program
  .command('wallet-sweep')
  .description('Sweep funds from a WIF private key')
  .option('-n, --name <string>', 'wallet name receiving BCH')
  .option('-w, --wif <string>', 'WIF private key to sweep')
  .action(walletSweep.run)

program
  .command('send-bch')
  .description('Send BCH to an address')
  .option('-n, --name <string>', 'wallet name sending BCH')
  .option('-a, --addr <string>', 'address to send BCH to')
  .option('-q, --qty <string>', 'The quantity of BCH to send')
  .action(sendBch.run)

program
  .command('send-tokens')
  .description('Send SLP tokens to an address')
  .option('-n, --name <string>', 'wallet name sending BCH')
  .option('-a, --addr <string>', 'address to send BCH to')
  .option('-q, --qty <string>', 'The quantity of BCH to send')
  .option('-t, --tokenId <string>', 'The token ID of the token to send')
  .action(sendTokens.run)

program
  .command('msg-sign')
  .description('Sign a message using the wallets private key')
  .option('-n, --name <string>', 'wallet to sign the message')
  .option('-m, --msg <string>', 'Message to sign')
  .action(msgSign.run)

program
  .command('msg-verify')
  .description('Verify a signature')
  .option('-s, --sig <string>', 'Signature')
  .option('-m, --msg <string>', 'Cleartext message that was signed')
  .option(
    '-a, --addr <string>',
    'BCH address generated from private key that signed the message'
  )
  .action(msgVerify.run)

program
  .command('token-info')
  .description('Get information about a token.')
  .option(
    '-t, --tokenId <string>',
    'The token ID of the token to get information about'
  )
  .action(tokenInfo.run)

program
  .command('token-tx-history')
  .description('Get the transaction history for a token.')
  .option(
    '-t, --tokenId <string>',
    'The token ID of the token to get the transaction history for'
  )
  .action(tokenTxHistory.run)

program
  .command('token-create-fungible')
  .description('Create a new SLP Type1 fugible token.')
  .option('-n, --walletName <string>', 'The name of the wallet')
  .option('-m, --tokenName <string>', 'The name of the token')
  .option('-t, --ticker <string>', 'The ticker of the token')
  .option('-d, --decimals <number>', 'The number of decimals of the token')
  .option('-q, --qty <number>', 'The quantity of tokens to create')
  .option('-u, --url <string>', '(optional) URL to attach to token (Used for immutable data)')
  .option('-h, --hash <string>', '(optional) TX hash to attach to token (Used for mutable data)')
  .action(tokenCreateFungible.run)

program
  .command('token-create-group')
  .description('Create a new SLP Group token.')
  .option('-n, --walletName <string>', 'The name of the wallet')
  .option('-m, --tokenName <string>', 'The name of the token')
  .option('-t, --ticker <string>', 'The ticker of the token')
  .option('-q, --qty <string>', '(optional) The quantity of tokens to create. Defaults to 1')
  .option('-u, --url <string>', '(optional) URL to attach to token (Used for immutable data)')
  .option('-h, --hash <string>', '(optional) TX hash to attach to token (Used for mutable data)')
  .action(tokenCreateGroup.run)

program
  .command('token-create-nft')
  .description('Create a new SLP NFT token.')
  .option('-n, --walletName <string>', 'The name of the wallet')
  .option('-m, --tokenName <string>', 'The name of the token')
  .option('-t, --ticker <string>', 'The ticker of the token')
  .option('-i, --tokenId <string>', 'Token ID of Group token to burn, to generate the NFT')
  .option('-u, --url <string>', '(optional) URL to attach to token (Used for immutable data)')
  .option('-h, --hash <string>', '(optional) TX hash to attach to token (Used for mutable data)')
  .action(tokenCreateNFT.run)

program
  .command('token-mint')
  .description('Mint new Fungible (Type 1) or Group tokens.')
  .option('-n, --walletName <string>', 'The name of the wallet')
  .option('-q, --qty <string>', 'The quantity of tokens to create.')
  .option('-t, --tokenId <string>', 'Token ID')
  .option('-r, --receiver <string>', '(optional) Receiver of new baton. Defaults to same wallet. <null> burns baton.')
  .action(tokenMint.run)

program
  .command('token-mda-tx')
  .description('Create TXID for token mutable data')
  .option('-n, --walletName <string>', 'The name of the wallet to pay for transaction')
  .option('-a, --mda <string>', 'Mutable data address')
  .action(tokenMdaTx.run)

program.parseAsync(process.argv)

```

`/home/trout/work/psf/code/psf-slp-wallet/README.md`:

```md
# psf-slp-wallet

This is a command-line interface (CLI) application for creating and managing Simple Ledger Protocol (SLP) tokens.

This is a fork of [psf-bch-wallet](https://github.com/Permissionless-Software-Foundation/psf-bch-wallet). This CLI has all the same commands as that one, plus additional commands for managing SLP tokens.


## Installation

This software requires node.js v20 or higher. Instructions for installation:

- `git clone https://github.com/Permissionless-Software-Foundation/psf-slp-wallet`
- `cd psf-slp-wallet`
- `npm install`

## Usage

### Display Help

- `node psf-slp-wallet.js help`

### SLP Token Commands

#### Token Info

Get information about an SLP token. Outputs a JSON object with token metadata.

- `node psf-slp-wallet.js token-info -t 1d542ac6b26a2c85a892b79b7ec39dfba5c731b95c644cf5aef75e580f5c7660`

##### Arguments
- Use the `-t` flag to specify the token ID of the token to get information about (required).


#### Token Transaction History

Get the transaction history for an SLP token. Outputs a JSON object with the transaction history.

- `node psf-slp-wallet.js token-tx-history -t 1d542ac6b26a2c85a892b79b7ec39dfba5c731b95c644cf5aef75e580f5c7660`

##### Arguments
- Use the `-t` flag to specify the token ID of the token to get the transaction history for (required).


#### Create a Fungible Token

Create a new SLP Type1 fungible token.

- `node psf-slp-wallet.js token-create-fungible -n wallet1 -m "My Token" -t MYTOK -d 8 -q 100000000`

##### Arguments
- Use the `-n` flag to specify the name of the wallet (required).
- Use the `-m` flag to specify the name of the token (required).
- Use the `-t` flag to specify the ticker of the token (required).
- Use the `-d` flag to specify the number of decimals of the token (required).
- Use the `-q` flag to specify the quantity of tokens to create (required).

#### Create a Group Token

Create a new SLP Group token.

- `node psf-slp-wallet.js token-create-group -n wallet1 -m "My Group Token" -t MYGT`

##### Arguments
- Use the `-n` flag to specify the name of the wallet (required).
- Use the `-m` flag to specify the name of the token (required).
- Use the `-t` flag to specify the ticker of the token (required).
- Use the `-q` flag to specify the quantity of tokens to create (optional).
- Use the `-u` flag to specify the url of tokens to create (optional).
- Use the `-h` flag to specify the hash of tokens to create (optional).


#### Create NFT

Create a new NFT.

- `node psf-slp-wallet.js token-create-nft -n wallet1 -m "My NFT" -t MNFT -i 9921cd7d19ca536e595f69a89fbc73e10cc446a7fe80acb3d78bd2b036997fe2`

##### Arguments
- Use the `-n` flag to specify the name of the wallet (required).
- Use the `-m` flag to specify the name of the token (required).
- Use the `-t` flag to specify the ticker of the token (required).
- Use the `-i` flag to specify the Group token to burn, to generate the NFT (required).
- Use the `-u` flag to specify the url of tokens to create (optional).
- Use the `-h` flag to specify the hash of tokens to create (optional).

#### Mint Tokens

Mint new Fungible (Type 1) or Group tokens.

- `node psf-slp-wallet.js token-mint -n wallet1 -q 1 -t 1d542ac6b26a2c85a892b79b7ec39dfba5c731b95c644cf5aef75e580f5c7660`

##### Arguments
- Use the `-n` flag to specify the name of the wallet (required).
- Use the `-q` flag to specify the quantity of tokens to create (required).
- Use the `-t` flag to specify the token ID of the token to mint (required).
- Use the `-r` flag to specify the receiver of the new baton (optional).

#### Create Mutable Data Address (MDA)

Create a new Mutable Data Address (MDA) for a token.

- `node psf-slp-wallet.js token-mda-tx -n wallet1 -a bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h`

##### Arguments
- Use the `-n` flag to specify the name of the wallet to pay for transaction (required).
- Use the `-a` flag to specify the Mutable Data Address (MDA) (required).



```

`/home/trout/work/psf/code/psf-slp-wallet/LICENSE.md`:

```md
Copyright 2022-2025 Chris Troutner

MIT LICENSE

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

```

`/home/trout/work/psf/code/psf-slp-wallet/config/index.js`:

```js
/*
  Configure your CLI app with these settings.
  Modify these values to suite your needs.

  More info at https://CashStack.info
*/

const config = {
  // The REST URL for the server used by minimal-slp-wallet.
  //restURL: 'https://free-bch.fullstack.cash',
  restURL: 'https://dev-consumer.psfoundation.info',

  // consumer-api = web 3 Cash Stack (ipfs-bch-wallet-consumer)
  // rest-api = web 2 Cash Stack (bch-api)
  interface: 'consumer-api'
}

export default config

```

`/home/trout/work/psf/code/psf-slp-wallet/package.json`:

```json
{
  "name": "psf-slp-wallet",
  "version": "1.0.0",
  "description": "",
  "main": "psf-slp-wallet.js",
  "type": "module",
  "scripts": {
    "test": "c8 --reporter=text mocha --exit --timeout 15000 --recursive test/unit",
    "lint": "standard --env mocha --fix",
    "coverage": "c8 --reporter=html mocha --exit --timeout 15000 --recursive test/unit/"
  },
  "author": "Chris Troutner",
  "license": "MIT",
  "dependencies": {
    "bch-token-sweep": "2.2.1",
    "cli-table": "0.3.11",
    "collect.js": "4.36.1",
    "commander": "12.1.0",
    "minimal-slp-wallet": "5.13.2",
    "shelljs": "0.8.5"
  },
  "devDependencies": {
    "c8": "10.1.2",
    "chai": "5.1.1",
    "mocha": "10.7.3",
    "semantic-release": "24.1.2",
    "sinon": "19.0.2",
    "standard": "17.1.2"
  },
  "release": {
    "publish": [
      {
        "path": "@semantic-release/npm",
        "npmPublish": false
      }
    ]
  }
}

```
