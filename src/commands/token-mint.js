/*
This command is used to Mint additional fungible (Type 1) or Group tokens if the wallet has a minting
baton.
*/
// Local libraries
import config from '../../config/index.js'
import WalletUtil from '../lib/wallet-util.js'

class TokenMint {
  constructor () {
    // Encapsulate dependencies.
    this.walletUtil = new WalletUtil()
    this.config = config

    // Bind 'this' object to all subfunctions.
    this.run = this.run.bind(this)
    this.validateFlags = this.validateFlags.bind(this)
    this.openWallet = this.openWallet.bind(this)
    this.generateMintTx = this.generateMintTx.bind(this)
  }

  async run (flags) {
    try {
      // Validate input flags
      this.validateFlags(flags)

      // Instantiate the wallet and bch-js
      await this.openWallet(flags)

      const hex = await this.generateMintTx(flags)
      // console.log('hex: ', hex)

      const txid = await this.wallet.broadcast({ hex })

      console.log(`New NFT ${flags.ticker} created! Token ID: ${txid}`)
      console.log(`https://explorer.tokentiger.com/?tokenid=${txid}`)

      return true
    } catch (err) {
      console.log('Error in token-create-nft.js/run(): ', err)
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
  async generateMintTx (flags) {
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

      // Get mint batons.
      const mintBatons = this.wallet.utxos.utxoStore.slpUtxos.type1.mintBatons.concat(
        this.wallet.utxos.utxoStore.slpUtxos.group.mintBatons
      )

      // Filter out the batons for the selected token.
      const filteredBatons = mintBatons.filter(x => x.tokenId === flags.tokenId)
      if (filteredBatons.length === 0) {
        throw new Error(`A minting baton for token ID ${flags.tokenId} could not be found in the wallet.`)
      }

      const mintBaton = filteredBatons[0]
      // console.log(`mintBaton: ${JSON.stringify(mintBaton, null, 2)}`)

      // add the mint baton as an input.
      transactionBuilder.addInput(mintBaton.tx_hash, mintBaton.tx_pos)

      // Set the transaction fee. Manually set for ease of example.
      const txFee = 550

      // amount to send back to the sending address.
      // Subtract two dust transactions for minting baton and tokens.
      const remainder = originalAmount - 546 * 2 - txFee

      // Destroy the baton?
      let destroyBaton = false
      if (flags.receiver === 'null') destroyBaton = true

      // Generate the OP_RETURN entry for an SLP MINT transaction.
      let script
      if (mintBaton.tokenType === 129) {
        script = this.bchjs.SLP.NFT1.mintNFTGroupOpReturn([mintBaton], flags.qty, destroyBaton)
      } else {
        // tokenType === 1 (fungible token)
        script = this.bchjs.SLP.TokenType1.generateMintOpReturn([mintBaton], flags.qty, destroyBaton)
      }

      // OP_RETURN needs to be the first output in the transaction.
      transactionBuilder.addOutput(script, 0)

      // Send dust transaction representing the tokens.
      const cashAddress = this.wallet.walletInfo.cashAddress
      transactionBuilder.addOutput(
        this.bchjs.Address.toLegacyAddress(cashAddress),
        546
      )

      // Send dust transaction representing minting baton.
      if (!destroyBaton) {
        if (flags.receiver) {
          transactionBuilder.addOutput(
            this.bchjs.Address.toLegacyAddress(flags.receiver),
            546
          )
        } else {
          transactionBuilder.addOutput(
            this.bchjs.Address.toLegacyAddress(cashAddress),
            546
          )
        }
      }

      // add output to send BCH remainder of UTXO.
      transactionBuilder.addOutput(cashAddress, remainder)

      // Generate a keypair from the change address.
      // const keyPair = bchjs.HDNode.toKeyPair(change)
      const keyPair = this.bchjs.ECPair.fromWIF(this.wallet.walletInfo.privateKey)

      // Sign the first input
      let redeemScript
      transactionBuilder.sign(
        0,
        keyPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        originalAmount
      )

      // Sign the second input
      transactionBuilder.sign(
        1,
        keyPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        mintBaton.value
      )

      // build tx
      const tx = transactionBuilder.build()
      // output rawhex
      const hex = tx.toHex()

      return hex
    } catch (err) {
      console.error('Error in generateMintTx()')
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
        'You must specify a quantity of tokens to create with the -q flag.'
      )
    }

    const tokenId = flags.tokenId
    if (!tokenId || tokenId === '') {
      throw new Error('You must specify a tokenId ( Group token to burn ) for the NFT with the -t flag.')
    }

    return true
  }
}

export default TokenMint
