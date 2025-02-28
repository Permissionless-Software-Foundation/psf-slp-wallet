/*
  Unit tests for the wallet-sweep command.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import WalletCreate from '../../../src/commands/wallet-create.js'
import WalletUtil from '../../../src/lib/wallet-util.js'
import WalletSweep from '../../../src/commands/wallet-sweep.js'

const walletCreate = new WalletCreate()
const walletUtil = new WalletUtil()

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#wallet-sweep', () => {
  let uut
  let sandbox

  before(async () => {
    await walletCreate.createWallet(filename)
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new WalletSweep()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    await fs.rm(filename)
  })

  describe('#sweepWif', () => {
    it('should sweep funds from a private key', async () => {
      // Instantiate the minimal-slp-wallet
      uut.bchWallet = await walletUtil.instanceWallet('test123')

      // Mock dependencies
      class MockSweepLib {
        populateObjectFromNetwork () {}
        async sweepTo () {}
      }
      uut.BchTokenSweep = MockSweepLib
      sandbox.stub(uut.bchWallet.ar, 'sendTx').resolves('fake-txid')

      const flags = {
        wif: 'Kzq8EEyjkXGzDmBbWxHWY8bxayxXawVDmrnmgq7JQmhRgMCrorfj',
        name: 'test123'
      }

      const result = await uut.sweepWif(flags)

      assert.equal(result, 'fake-txid')
    })

    it('should catch, report, and throw errors', async () => {
      try {
        await uut.sweepWif()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'read properties')
      }
    })
  })

  describe('#validateFlags()', () => {
    it('validateFlags() should return true if all arguments are supplied.', () => {
      const flags = {
        name: 'test123',
        wif: 'Kzq8EEyjkXGzDmBbWxHWY8bxayxXawVDmrnmgq7JQmhRgMCrorfj'
      }

      assert.equal(uut.validateFlags(flags), true, 'return true')
    })

    it('validateFlags() should throw error if name is not supplied.', () => {
      try {
        uut.validateFlags({})

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet name with the -n flag',
          'Expected error message.'
        )
      }
    })

    it('validateFlags() should throw error if wif is not supplied.', () => {
      try {
        const flags = {
          name: 'test123'
        }
        uut.validateFlags(flags)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a private key to sweep with the -w flag.',
          'Expected error message.'
        )
      }
    })
  })

  describe('#run', () => {
    it('should execute the run function', async () => {
      // Mock dependencies
      sandbox.stub(uut, 'sweepWif').resolves('fake-txid')

      const flags = {
        name: 'test123',
        wif: 'Kzq8EEyjkXGzDmBbWxHWY8bxayxXawVDmrnmgq7JQmhRgMCrorfj'
      }

      const result = await uut.run(flags)

      assert.equal(result, true)
    })

    it('should handle an error', async () => {
      const result = await uut.run()

      assert.equal(result, 0)
    })
  })
})
