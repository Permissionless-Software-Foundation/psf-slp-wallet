/*
  Unit tests for the wallet-balance command.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import WalletCreate from '../../../src/commands/wallet-create.js'
import BchWalletMock from '../../mocks/msw-mock.js'
import WalletBalance from '../../../src/commands/wallet-balance.js'
import WalletServiceMock from '../../mocks/wallet-service-mock.js'
const walletCreate = new WalletCreate()

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#wallet-balance', () => {
  let uut
  let sandbox

  before(async () => {
    await walletCreate.createWallet(filename)
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new WalletBalance()
  })

  afterEach(() => {
    sandbox.restore()
  })

  after(async () => {
    await fs.rm(filename)
  })

  describe('#displayBalance', () => {
    it('should display wallet balances', () => {
      const mockWallet = new BchWalletMock()
      // console.log('mockWallet: ', mockWallet)

      const result = uut.displayBalance(mockWallet)

      assert.equal(result, true)
    })

    it('should display verbose UTXO data when flag is set', () => {
      const mockWallet = new BchWalletMock()
      // console.log('mockWallet: ', mockWallet)

      const flags = {
        verbose: true
      }

      const result = uut.displayBalance(mockWallet, flags)

      assert.equal(result, true)
    })

    it('should catch and throw errors', () => {
      try {
        uut.displayBalance()

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log(err)
        assert.include(err.message, 'Cannot read prop')
      }
    })

    it('should display minting batons', () => {
      const mockWallet = new BchWalletMock()
      // console.log('mockWallet: ', mockWallet)

      // Force UTXOs
      mockWallet.utxos.utxoStore = {
        bchUtxos: [{
          height: 744046,
          tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
          tx_pos: 3,
          value: 577646,
          txid: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
          vout: 3,
          address: 'bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h',
          isSlp: false,
          satoshis: 577646
        }],
        slpUtxos: {
          type1: {
            tokens: [],
            mintBatons: []
          },
          group: {
            tokens: [],
            mintBatons: [{
              tokenId: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
              tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
              tx_pos: 4,
              value: 546,
              tokenType: 129,
              utxoType: 'group',
              decimals: 0
            }]
          },
          nft: {
            tokens: []
          }
        }
      }

      const result = uut.displayBalance(mockWallet)

      assert.equal(result, true)
    })
  })

  describe('#getBalances', () => {
    it('should return wallet instance with updated UTXOs', async () => {
      // Mock dependencies
      uut.walletService = new WalletServiceMock()
      uut.bchWallet = new BchWalletMock()

      const result = await uut.getBalances()
      // console.log('result: ', result)

      assert.property(result, 'walletInfo')
      assert.property(result, 'utxos')
      assert.property(result.utxos, 'utxoStore')
    })

    it('should catch and throw errors', async () => {
      try {
        await uut.getBalances()

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'read properties')
      }
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

  describe('#run', () => {
    it('should execute the run function', async () => {
      // Mock dependencies
      sandbox.stub(uut, 'getBalances').resolves({})
      sandbox.stub(uut, 'displayBalance').resolves({})
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(new BchWalletMock())

      const flags = {
        name: 'test123'
      }

      const result = await uut.run(flags)

      assert.equal(result, true)
    })

    it('should handle an error without a message', async () => {
      const result = await uut.run()

      assert.equal(result, 0)
    })
  })
})
