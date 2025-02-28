/*
  Unit tests for the wallet-create command.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import WalletCreate from '../../../src/commands/wallet-create.js'
import BchWalletMock from '../../mocks/msw-mock.js'

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#wallet-create', () => {
  let uut
  let sandbox

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new WalletCreate()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#createWallet()', () => {
    it('should exit with error status if called without a filename.', async () => {
      try {
        await uut.createWallet(undefined, undefined)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(
          err.message,
          'filename required.',
          'Should throw expected error.'
        )
      }
    })

    it('should create a mainnet wallet file with the given name', async () => {
      // Mock dependencies
      uut.BchWallet = BchWalletMock

      const walletData = await uut.createWallet(filename)
      // console.log(`walletData: ${JSON.stringify(walletData, null, 2)}`)

      assert.property(walletData, 'mnemonic')
      assert.property(walletData, 'privateKey')
      assert.property(walletData, 'publicKey')
      assert.property(walletData, 'address')
      assert.property(walletData, 'cashAddress')
      assert.property(walletData, 'slpAddress')
      assert.property(walletData, 'legacyAddress')
      assert.property(walletData, 'hdPath')
      assert.property(walletData, 'description')

      // Clean up.
      await fs.rm(filename)
    })
  })

  describe('#validateFlags()', () => {
    it('validateFlags() should return true if name is supplied.', () => {
      assert.equal(uut.validateFlags({ name: 'test' }), true, 'return true')
    })

    it('validateFlags() should throw error if name is not supplied.', () => {
      try {
        uut.validateFlags({})
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet name with the -n flag',
          'Expected error message.'
        )
      }
    })
  })

  describe('#run()', () => {
    it('should create the wallet with expected properties', async () => {
      // Mock dependencies
      uut.BchWallet = BchWalletMock

      const flags = {
        name: 'test123'
      }
      // Mock methods that will be tested elsewhere.
      // sandbox.stub(uut, 'parse').returns({ flags })

      const walletData = await uut.run(flags)
      // console.log('walletData: ', walletData)

      assert.property(walletData, 'mnemonic')
      assert.property(walletData, 'privateKey')
      assert.property(walletData, 'publicKey')
      assert.property(walletData, 'address')
      assert.property(walletData, 'cashAddress')
      assert.property(walletData, 'slpAddress')
      assert.property(walletData, 'legacyAddress')
      assert.property(walletData, 'hdPath')
      assert.property(walletData, 'description')

      // Clean up.
      await fs.rm(filename)
    })

    it('should add a description when provided', async () => {
      // Mock dependencies
      uut.BchWallet = BchWalletMock

      const flags = {
        name: 'test123',
        description: 'test'
      }
      // Mock methods that will be tested elsewhere.
      // sandbox.stub(uut, 'parse').returns({ flags })

      const walletData = await uut.run(flags)

      assert.property(walletData, 'mnemonic')
      assert.property(walletData, 'privateKey')
      assert.property(walletData, 'publicKey')
      assert.property(walletData, 'address')
      assert.property(walletData, 'cashAddress')
      assert.property(walletData, 'slpAddress')
      assert.property(walletData, 'legacyAddress')
      assert.property(walletData, 'hdPath')
      assert.property(walletData, 'description')

      // Clean up.
      await fs.rm(filename)
    })

    it('should return 0 on errors', async () => {
      const result = await uut.run({})

      assert.equal(result, 0)
    })
  })
})
