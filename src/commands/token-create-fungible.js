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
      console.log('Error in token-tx-history.js/run(): ', err.message)

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
