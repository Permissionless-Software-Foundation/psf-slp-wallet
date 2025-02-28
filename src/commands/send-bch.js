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
