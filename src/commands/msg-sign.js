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
