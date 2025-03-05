/*
   This command is used to retrieve information about a token.
  It returns the Genesis data, mutable data, and immutable data associated
  with a token..
*/

// Global npm libraries
import BchWallet from 'minimal-slp-wallet'
import axios from 'axios'

// Local libraries
import WalletUtil from '../lib/wallet-util.js'
import config from '../../config/index.js'

class TokenInfo {
  constructor () {
    // Encapsulate dependencies.
    this.walletUtil = new WalletUtil()
    this.BchWallet = BchWallet
    this.axios = axios
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
