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
