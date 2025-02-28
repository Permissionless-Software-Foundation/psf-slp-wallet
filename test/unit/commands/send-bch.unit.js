/*
  Unit tests for send-bch command.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import WalletCreate from '../../../src/commands/wallet-create.js'
import WalletUtil from '../../../src/lib/wallet-util.js'
import SendBch from '../../../src/commands/send-bch.js'

const walletCreate = new WalletCreate()
const walletUtil = new WalletUtil()

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#send-bch', () => {
  let uut
  let sandbox

  before(async () => {
    await walletCreate.createWallet(filename)
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new SendBch()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    await fs.rm(filename)
  })

  describe('#send-bch', () => {
    it('should send BCH to provided address', async () => {
      // Instantiate the minimal-slp-wallet
      uut.bchWallet = await walletUtil.instanceWallet('test123')

      // Mock the wallet functions so we don't make network calls.
      sandbox.stub(uut.bchWallet, 'initialize').resolves()
      sandbox.stub(uut.bchWallet, 'getBalance').resolves(0.1)
      sandbox.stub(uut.bchWallet, 'send').resolves('fake-txid')

      const flags = {
        name: 'test123',
        qty: 0.01,
        addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl'
      }

      const result = await uut.sendBch(flags)

      assert.equal(result, 'fake-txid')
    })

    it('should throw error if wallet balance is less than quanity to send', async () => {
      try {
        // Instantiate the minimal-slp-wallet
        uut.bchWallet = await walletUtil.instanceWallet('test123')

        // Mock the wallet functions so we don't make network calls.
        sandbox.stub(uut.bchWallet, 'initialize').resolves()
        sandbox.stub(uut.bchWallet, 'getBalance').resolves(0.1)
        sandbox.stub(uut.bchWallet, 'send').resolves('fake-txid')

        const flags = {
          name: 'test123',
          qty: 1,
          addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl'
        }

        await uut.sendBch(flags)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'Insufficient funds.')
      }
    })
  })

  describe('#validateFlags()', () => {
    it('validateFlags() should return true if all arguments are supplied.', () => {
      const flags = {
        name: 'test123',
        qty: 1,
        addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl'
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

    it('validateFlags() should throw error if addr is not supplied.', () => {
      try {
        const flags = {
          name: 'test123'
        }
        uut.validateFlags(flags)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a receiver address with the -a flag.',
          'Expected error message.'
        )
      }
    })

    it('validateFlags() should throw error if qty is not supplied.', () => {
      try {
        const flags = {
          name: 'test123',
          addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl'
        }
        uut.validateFlags(flags)

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a quantity in BCH with the -q flag.',
          'Expected error message.'
        )
      }
    })
  })

  describe('#run', () => {
    it('should execute the run function', async () => {
      // Mock dependencies
      sandbox.stub(uut, 'sendBch').resolves('fake-txid')

      const flags = {
        name: 'test123',
        qty: 0.01,
        addr: 'bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl'
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
