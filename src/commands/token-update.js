/*
 This command is used to update the mutable data for a token.

 PS002 specification for mutable data:
 https://github.com/Permissionless-Software-Foundation/specifications/blob/master/ps002-slp-mutable-data.md
*/

// Local libraries
import config from '../../config/index.js'
import WalletUtil from '../lib/wallet-util.js'
import BCHJS from '@psf/bch-js'
import { SlpMutableData } from 'slp-mutable-data'

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
    this.displayData = this.displayData.bind(this)
    this.updateMutableData = this.updateMutableData.bind(this)
  }

  async run (flags) {
    try {
      // Validate input flags
      this.validateFlags(flags)

      // Instantiate the wallet and bch-js
      await this.openWallet(flags)

      const hex = await this.updateMutableData(flags)
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

  async updateMutableData (flags) {
    try {
      const cid = flags.cid

      const slpMutableData = new SlpMutableData({ wallet: this.wallet })

      const hex = await slpMutableData.data.writeCIDToOpReturn(cid)

      return hex
    } catch (err) {
      console.error('Error in updateMutableData()')
      throw err
    }
  }

  displayData (flags, txid) {
    console.log('Mutable data updated!')
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

    // CID of new mutable data
    const cid = flags.cid
    if (!cid || cid === '') {
      throw new Error('You must specify a CID with the -c flag.')
    }

    return true
  }
}

export default TokenMdaTx
