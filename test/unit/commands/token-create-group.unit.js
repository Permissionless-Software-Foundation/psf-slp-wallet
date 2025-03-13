/*
Unit tests for the token-create-group command.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import TokenCreateGroup from '../../../src/commands/token-create-group.js'
import MinimalSlpWalletMock from '../../mocks/msw-mock.js'
import WalletCreate from '../../../src/commands/wallet-create.js'
const walletCreate = new WalletCreate()

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#token-create-group', () => {
  let uut
  let sandbox
  let mockWallet

  before(async () => {
    await walletCreate.createWallet(filename)
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new TokenCreateGroup()
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
        tokenName: 'test',
        ticker: 'TST'
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

    it('should throw error if token name is not supplied.', () => {
      try {
        const flags = {
          walletName: 'test123'
        }
        uut.validateFlags(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a name for the token with the -m flag.',
          'Expected error message.'
        )
      }
    })

    it('should throw error if token ticker is not supplied.', () => {
      try {
        const flags = {
          walletName: 'test123',
          tokenName: 'test'
        }
        uut.validateFlags(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a ticker for the token with the -t flag.',
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
      // console.log('result: ', result)

      assert.property(result, 'walletInfoPromise')
    })
  })

  describe('#generateTokenTx', () => {
    it('should generate a hex transaction', async () => {
      // Mock data
      const bchUtxo = {
        height: 744046,
        tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        tx_pos: 3,
        value: 577646,
        txid: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        vout: 3,
        address: 'bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h',
        isSlp: false,
        satoshis: 577646
      }

      const flags = {
        walletName: 'test123',
        tokenName: 'test',
        ticker: 'TST',
        qty: 1,
        url: 'test url',
        hash: '7a427a156fe70f83d3ccdd17e75804cc0df8c95c64ce04d256b3851385002a0b'
      }

      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

      // Instantiate the wallet and bch-js
      await uut.openWallet(flags)

      // Force bchUtxo.
      uut.wallet.utxos.utxoStore.bchUtxos = [bchUtxo]

      const result = await uut.generateTokenTx(flags)
      // console.log('result: ', result)

      assert.include(result, '020000000')
    })

    it('should throw an error if there are no BCH UTXOs to pay for tx', async () => {
      try {
        // Mock dependencies and force desired code path
        sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

        const flags = {
          walletName: 'test123'
        }

        // Instantiate the wallet and bch-js
        await uut.openWallet(flags)

        // Force bchUtxo.
        uut.wallet.utxos.utxoStore.bchUtxos = []

        await uut.generateTokenTx(flags)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'No BCH UTXOs available to pay for transaction.')
      }
    })

    it('should work with fully-hydrated flags object', async () => {
      // Mock data
      const bchUtxo = {
        height: 744046,
        tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        tx_pos: 3,
        value: 577646,
        txid: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
        vout: 3,
        address: 'bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h',
        isSlp: false,
        satoshis: 577646
      }

      const flags = {
        walletName: 'test123',
        tokenName: 'test',
        ticker: 'TST',
        qty: 100,
        url: 'test url',
        hash: '7a427a156fe70f83d3ccdd17e75804cc0df8c95c64ce04d256b3851385002a0b'
      }

      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

      // Instantiate the wallet and bch-js
      await uut.openWallet(flags)

      // Force bchUtxo.
      uut.wallet.utxos.utxoStore.bchUtxos = [bchUtxo]

      const result = await uut.generateTokenTx(flags)
      // console.log('result: ', result)

      assert.include(result, '020000000')
    })
  })

  describe('#run', () => {
    it('should execute the run function', async () => {
      // Mock dependencies
      uut.wallet = new MinimalSlpWalletMock()
      sandbox.stub(uut, 'validateFlags').returns(true)
      sandbox.stub(uut, 'openWallet').resolves(mockWallet)
      sandbox.stub(uut, 'generateTokenTx').resolves('fake-hex')

      const result = await uut.run({})

      assert.equal(result, true)
    })

    it('should handle an error', async () => {
      const result = await uut.run()

      assert.equal(result, 0)
    })
  })
})
