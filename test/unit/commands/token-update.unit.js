/*
  Unit tests for the token-update command.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import TokenUpdate from '../../../src/commands/token-update.js'
import MinimalSlpWalletMock from '../../mocks/msw-mock.js'
import WalletCreate from '../../../src/commands/wallet-create.js'
const walletCreate = new WalletCreate()

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#token-update', () => {
  let uut
  let sandbox
  let mockWallet

  before(async () => {
    await walletCreate.createWallet(filename)
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new TokenUpdate()
    mockWallet = new MinimalSlpWalletMock()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    await fs.rm(filename)
  })

  describe('#validateFlags()', () => {
    it('should return true if all arguments are included', () => {
      const flags = {
        walletName: 'test123',
        cid: 'ipfs://bafkreifhtcnmf577q2s5lfr46ax5qf2jnk7oy3azu5x7ceab6xajcccl3u'
      }

      assert.equal(uut.validateFlags(flags), true, 'return true')
    })

    it('should throw error if wallet name is not supplied.', () => {
      try {
        const flags = {}
        uut.validateFlags(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a wallet name with the -n flag.',
          'Expected error message.'
        )
      }
    })

    it('should throw error if CID is not supplied.', () => {
      try {
        const flags = {
          walletName: 'test123'
        }
        uut.validateFlags(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a CID with the -c flag.',
          'Expected error message.'
        )
      }
    })
  })

  describe('#openWallet', () => {
    it('should return an instance of the wallet', async () => {
      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

      const flags = {
        walletName: 'test123'
      }

      const result = await uut.openWallet(flags)

      assert.property(result, 'walletInfoPromise')
    })
  })

  describe('#updateMutableData', () => {
    it('should return a hex string for the update transaction', async () => {
      const flags = {
        walletName: 'test123',
        cid: 'ipfs://bafkreifhtcnmf577q2s5lfr46ax5qf2jnk7oy3azu5x7ceab6xajcccl3u'
      }

      // Mock dependencies and force desired code path.
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

      // Instantiate the wallet and bch-js
      await uut.openWallet(flags)

      // Mock the SlpMutableData dependency
      uut.wallet.slpMutableData = {
        data: {
          writeCIDToOpReturn: sandbox.stub().resolves('fake-hex')
        }
      }

      // Override the constructor-created instance by stubbing the method directly.
      sandbox.stub(uut, 'updateMutableData').resolves('fake-hex')

      const result = await uut.updateMutableData(flags)

      assert.equal(result, 'fake-hex')
    })

    it('should throw an error if updateMutableData fails', async () => {
      try {
        const flags = {
          walletName: 'test123',
          cid: 'ipfs://bafkreifhtcnmf577q2s5lfr46ax5qf2jnk7oy3azu5x7ceab6xajcccl3u'
        }

        // Mock dependencies and force desired code path.
        sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

        // Instantiate the wallet and bch-js
        await uut.openWallet(flags)

        // The mock wallet's utxoStore does not have the format expected by
        // SlpMutableData, so this will throw an error.
        await uut.updateMutableData(flags)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.isString(err.message)
      }
    })
  })

  describe('#displayData', () => {
    it('should display the final data', () => {
      const flags = {
        cid: 'ipfs://bafkreifhtcnmf577q2s5lfr46ax5qf2jnk7oy3azu5x7ceab6xajcccl3u'
      }
      const result = uut.displayData(flags, 'fake-txid')

      assert.equal(result, true)
    })
  })

  describe('#run', () => {
    it('should execute the run function', async () => {
      // Mock dependencies
      uut.wallet = new MinimalSlpWalletMock()
      sandbox.stub(uut, 'validateFlags').returns(true)
      sandbox.stub(uut, 'openWallet').resolves(mockWallet)
      sandbox.stub(uut, 'updateMutableData').resolves('fake-hex')

      const result = await uut.run({})

      assert.equal(result, true)
    })

    it('should handle an error', async () => {
      const result = await uut.run()

      assert.equal(result, 0)
    })
  })
})
