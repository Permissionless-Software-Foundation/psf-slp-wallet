/*
  Unit tests for the wallet-util.js library.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import WalletUtil from '../../../src/lib/wallet-util.js'
import WalletCreate from '../../../src/commands/wallet-create.js'

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#wallet-util', () => {
  let uut
  let sandbox

  before(async () => {
    // Create a mainnet wallet.
    const createWallet = new WalletCreate()
    await createWallet.createWallet(filename)
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new WalletUtil()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    // Clean up
    await fs.rm(filename)
  })

  describe('#saveWallet', () => {
    it('should save a wallet file', async () => {
      const result = await uut.saveWallet(filename, {})

      await fs.rm(filename)

      // Create new mainnet wallet as part of cleanup.
      const createWallet = new WalletCreate()
      await createWallet.createWallet(filename)

      assert.equal(result, true)
    })
  })

  describe('#instanceWallet', () => {
    it('should generate an instance of the wallet', async () => {
      const wallet = await uut.instanceWallet('test123')

      assert.property(wallet, 'walletInfo')
    })

    it('should throw error if wallet name is not specified', async () => {
      try {
        await uut.instanceWallet()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'walletName is required.')
      }
    })
  })
})
