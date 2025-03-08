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
