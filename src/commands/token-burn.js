/*
  Burn a specific quantity of SLP tokens.
*/

// Local libraries
import config from '../../config/index.js'
import WalletUtil from '../lib/wallet-util.js'

class TokenBurn {
  constructor () {
    // Encapsulate dependencies.
    this.walletUtil = new WalletUtil()
    this.config = config

    // Bind 'this' object to all subfunctions.
    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.openWallet = this.openWallet.bind(this)
    this.generateBurnTx = this.generateBurnTx.bind(this)
  }

  async run (flags) {
    try {
      // Validate input flags
      this.validateFlags(flags)

      // Instantiate the wallet and bch-js
      await this.openWallet(flags)

      const hex = await this.generateBurnTx(flags)
      // console.log('hex: ', hex)

      const txid = await this.wallet.broadcast({ hex })

      console.log(`Tokens burned! TXID: ${txid}`)
      console.log(`https://bch.loping.net/tx/${txid}`)

      return true
    } catch (err) {
      console.log('Error in token-burn.js/run(): ', err)
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

  // Generate a hex string transaction that will burn the specified quantity of tokens.
  async generateBurnTx (flags) {
    try {
      // Get a UTXO to pay for the transaction
      const bchUtxos = this.wallet.utxos.utxoStore.bchUtxos
      if (bchUtxos.length === 0) throw new Error('No BCH UTXOs available to pay for transaction.')

      // Pay for the tx with the biggest UTXO in the array.
      const bchUtxo = this.bchjs.Utxo.findBiggestUtxo(bchUtxos)
      // console.log(`bchUtxo: ${JSON.stringify(bchUtxo, null, 2)}`)

      // Get token UTXOs matching the specified token ID.
      const tokenUtxos = this.wallet.utxos.utxoStore.slpUtxos.type1.tokens.filter(
        utxo => utxo.tokenId === flags.tokenId
      )

      if (tokenUtxos.length === 0) {
        throw new Error(`No token UTXOs found for token ID ${flags.tokenId}`)
      }

      // Generate the SLP OP_RETURN for burning.
      const slpData = this.bchjs.SLP.TokenType1.generateBurnOpReturn(
        tokenUtxos,
        flags.qty
      )

      // instance of transaction builder
      const transactionBuilder = new this.bchjs.TransactionBuilder()

      const originalAmount = bchUtxo.value

      // Add the BCH UTXO as input to pay for the transaction.
      transactionBuilder.addInput(bchUtxo.tx_hash, bchUtxo.tx_pos)

      // Add each token UTXO as an input.
      for (let i = 0; i < tokenUtxos.length; i++) {
        transactionBuilder.addInput(tokenUtxos[i].tx_hash, tokenUtxos[i].tx_pos)
      }

      // Set the transaction fee. Manually set for ease of example.
      const txFee = 550

      // Amount to send back to the sending address.
      const remainder = originalAmount - txFee - 546
      if (remainder < 1) {
        throw new Error('Selected UTXO does not have enough satoshis')
      }

      // Add OP_RETURN as first output.
      transactionBuilder.addOutput(slpData, 0)

      // Send dust transaction representing remaining tokens back to the wallet.
      const cashAddress = this.wallet.walletInfo.cashAddress
      transactionBuilder.addOutput(
        this.bchjs.Address.toLegacyAddress(cashAddress),
        546
      )

      // Send the BCH change back to the wallet.
      transactionBuilder.addOutput(cashAddress, remainder)

      // Generate a keypair from the wallet's private key.
      const keyPair = this.bchjs.ECPair.fromWIF(this.wallet.walletInfo.privateKey)

      // Sign the BCH input.
      let redeemScript
      transactionBuilder.sign(
        0,
        keyPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        originalAmount
      )

      // Sign each token UTXO being consumed.
      for (let i = 0; i < tokenUtxos.length; i++) {
        transactionBuilder.sign(
          1 + i,
          keyPair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          tokenUtxos[i].value
        )
      }

      // build tx
      const tx = transactionBuilder.build()
      // output rawhex
      const hex = tx.toHex()

      return hex
    } catch (err) {
      console.error('Error in generateBurnTx()')
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
        'You must specify a quantity of tokens to burn with the -q flag.'
      )
    }

    const tokenId = flags.tokenId
    if (!tokenId || tokenId === '') {
      throw new Error('You must specify a token ID with the -t flag.')
    }

    return true
  }
}

export default TokenBurn
