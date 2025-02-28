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
