/*
  This is the primary entry point for the psf-bch-wallet CLI app.
  This app uses commander.js.
*/

// Global npm libraries
import { Command } from 'commander'

// Local libraries
import WalletCreate from './src/commands/wallet-create.js'
import WalletList from './src/commands/wallet-list.js'
import WalletAddrs from './src/commands/wallet-addrs.js'
import WalletBalance from './src/commands/wallet-balance.js'
import SendBch from './src/commands/send-bch.js'
import SendTokens from './src/commands/send-tokens.js'
import WalletSweep from './src/commands/wallet-sweep.js'
import MsgSign from './src/commands/msg-sign.js'
import MsgVerify from './src/commands/msg-verify.js'
import TokenInfo from './src/commands/token-info.js'
import TokenTxHistory from './src/commands/token-tx-history.js'
import TokenCreateFungible from './src/commands/token-create-fungible.js'
import TokenCreateGroup from './src/commands/token-create-group.js'
import TokenCreateNFT from './src/commands/token-create-nft.js'
import TokenMint from './src/commands/token-mint.js'
import TokenMdaTx from './src/commands/token-mda-tx.js'
import TokenUpdate from './src/commands/token-update.js'

// Instantiate the subcommands
const walletCreate = new WalletCreate()
const walletList = new WalletList()
const walletAddrs = new WalletAddrs()
const walletBalance = new WalletBalance()
const sendBch = new SendBch()
const sendTokens = new SendTokens()
const walletSweep = new WalletSweep()
const msgSign = new MsgSign()
const msgVerify = new MsgVerify()
const tokenInfo = new TokenInfo()
const program = new Command()
const tokenTxHistory = new TokenTxHistory()
const tokenCreateFungible = new TokenCreateFungible()
const tokenCreateGroup = new TokenCreateGroup()
const tokenCreateNFT = new TokenCreateNFT()
const tokenMint = new TokenMint()
const tokenMdaTx = new TokenMdaTx()
const tokenUpdate = new TokenUpdate()

program
  // Define the psf-bch-wallet app options
  .name('psf-slp-wallet')
  .description('A command-line BCH and SLP token wallet.')

// Define the wallet-create command
program
  .command('wallet-create')
  .description('Create a new wallet with name (-n <name>) and description (-d)')
  .option('-n, --name <string>', 'wallet name')
  .option('-d --description <string>', 'what the wallet is being used for')
  .action(walletCreate.run)

// Define the wallet-list command
program
  .command('wallet-list')
  .description('List existing wallets')
  .action(walletList.run)

program
  .command('wallet-addrs')
  .description('List the different addresses for a wallet.')
  .option('-n, --name <string>', 'wallet name')
  .action(walletAddrs.run)

program
  .command('wallet-balance')
  .description('Get balances in BCH and SLP tokens held by the wallet.')
  .option('-n, --name <string>', 'wallet name')
  .action(walletBalance.run)

program
  .command('wallet-sweep')
  .description('Sweep funds from a WIF private key')
  .option('-n, --name <string>', 'wallet name receiving BCH')
  .option('-w, --wif <string>', 'WIF private key to sweep')
  .action(walletSweep.run)

program
  .command('send-bch')
  .description('Send BCH to an address')
  .option('-n, --name <string>', 'wallet name sending BCH')
  .option('-a, --addr <string>', 'address to send BCH to')
  .option('-q, --qty <string>', 'The quantity of BCH to send')
  .action(sendBch.run)

program
  .command('send-tokens')
  .description('Send SLP tokens to an address')
  .option('-n, --name <string>', 'wallet name sending BCH')
  .option('-a, --addr <string>', 'address to send BCH to')
  .option('-q, --qty <string>', 'The quantity of BCH to send')
  .option('-t, --tokenId <string>', 'The token ID of the token to send')
  .action(sendTokens.run)

program
  .command('msg-sign')
  .description('Sign a message using the wallets private key')
  .option('-n, --name <string>', 'wallet to sign the message')
  .option('-m, --msg <string>', 'Message to sign')
  .action(msgSign.run)

program
  .command('msg-verify')
  .description('Verify a signature')
  .option('-s, --sig <string>', 'Signature')
  .option('-m, --msg <string>', 'Cleartext message that was signed')
  .option(
    '-a, --addr <string>',
    'BCH address generated from private key that signed the message'
  )
  .action(msgVerify.run)

program
  .command('token-info')
  .description('Get information about a token.')
  .option(
    '-t, --tokenId <string>',
    'The token ID of the token to get information about'
  )
  .action(tokenInfo.run)

program
  .command('token-tx-history')
  .description('Get the transaction history for a token.')
  .option(
    '-t, --tokenId <string>',
    'The token ID of the token to get the transaction history for'
  )
  .action(tokenTxHistory.run)

program
  .command('token-create-fungible')
  .description('Create a new SLP Type1 fugible token.')
  .option('-n, --walletName <string>', 'The name of the wallet')
  .option('-m, --tokenName <string>', 'The name of the token')
  .option('-t, --ticker <string>', 'The ticker of the token')
  .option('-d, --decimals <number>', 'The number of decimals of the token')
  .option('-q, --qty <number>', 'The quantity of tokens to create')
  .option('-u, --url <string>', '(optional) URL to attach to token (Used for immutable data)')
  .option('-h, --hash <string>', '(optional) TX hash to attach to token (Used for mutable data)')
  .action(tokenCreateFungible.run)

program
  .command('token-create-group')
  .description('Create a new SLP Group token.')
  .option('-n, --walletName <string>', 'The name of the wallet')
  .option('-m, --tokenName <string>', 'The name of the token')
  .option('-t, --ticker <string>', 'The ticker of the token')
  .option('-q, --qty <string>', '(optional) The quantity of tokens to create. Defaults to 1')
  .option('-u, --url <string>', '(optional) URL to attach to token (Used for immutable data)')
  .option('-h, --hash <string>', '(optional) TX hash to attach to token (Used for mutable data)')
  .action(tokenCreateGroup.run)

program
  .command('token-create-nft')
  .description('Create a new SLP NFT token.')
  .option('-n, --walletName <string>', 'The name of the wallet')
  .option('-m, --tokenName <string>', 'The name of the token')
  .option('-t, --ticker <string>', 'The ticker of the token')
  .option('-i, --tokenId <string>', 'Token ID of Group token to burn, to generate the NFT')
  .option('-u, --url <string>', '(optional) URL to attach to token (Used for immutable data)')
  .option('-h, --hash <string>', '(optional) TX hash to attach to token (Used for mutable data)')
  .action(tokenCreateNFT.run)

program
  .command('token-mint')
  .description('Mint new Fungible (Type 1) or Group tokens.')
  .option('-n, --walletName <string>', 'The name of the wallet')
  .option('-q, --qty <string>', 'The quantity of tokens to create.')
  .option('-t, --tokenId <string>', 'Token ID')
  .option('-r, --receiver <string>', '(optional) Receiver of new baton. Defaults to same wallet. <null> burns baton.')
  .action(tokenMint.run)

program
  .command('token-mda-tx')
  .description('Create TXID for token mutable data')
  .option('-n, --walletName <string>', 'The name of the wallet to pay for transaction')
  .option('-a, --mda <string>', 'Mutable data address')
  .action(tokenMdaTx.run)

program
  .command('token-update')
  .description('Update the mutable data for a token')
  .option('-n, --walletName <string>', 'The name of the wallet to pay for transaction')
  .option('-c, --cid <string>', 'CID of new mutable data')
  .action(tokenUpdate.run)

program.parseAsync(process.argv)
