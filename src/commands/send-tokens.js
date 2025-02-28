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
