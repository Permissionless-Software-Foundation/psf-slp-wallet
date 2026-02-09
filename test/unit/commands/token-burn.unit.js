/*
  Unit tests for the token-burn command.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import TokenBurn from '../../../src/commands/token-burn.js'
import MinimalSlpWalletMock from '../../mocks/msw-mock.js'
import WalletCreate from '../../../src/commands/wallet-create.js'
const walletCreate = new WalletCreate()

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#token-burn', () => {
  let uut
  let sandbox
  let mockWallet

  before(async () => {
    await walletCreate.createWallet(filename)
  })

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new TokenBurn()
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
        tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
        qty: 1
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

    it('should throw error if token quantity is not supplied.', () => {
      try {
        const flags = {
          walletName: 'test123'
        }
        uut.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a quantity of tokens to burn with the -q flag.',
          'Expected error message.'
        )
      }
    })

    it('should throw error if tokenId is not supplied.', () => {
      try {
        const flags = {
          walletName: 'test123',
          qty: 1
        }
        uut.validateFlags(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a token ID with the -t flag.',
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

  describe('#generateBurnTx', () => {
    it('should generate a hex transaction to burn tokens', async () => {
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

      const tokenUtxo = {
        height: 700522,
        tx_hash: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
        tx_pos: 1,
        value: 546,
        txid: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
        vout: 1,
        utxoType: 'token',
        tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
        tokenTicker: 'TROUT',
        tokenName: "Trout's test token",
        decimals: 2,
        tokenType: 1,
        tokenQty: '4.25',
        qtyStr: '4.25'
      }

      const flags = {
        walletName: 'test123',
        qty: 0.01,
        tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'
      }

      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

      // Instantiate the wallet and bch-js
      await uut.openWallet(flags)

      // Force UTXOs:
      uut.wallet.utxos.utxoStore = {
        bchUtxos: [bchUtxo],
        slpUtxos: {
          type1: {
            mintBatons: [],
            tokens: [tokenUtxo]
          },
          group: {
            tokens: [],
            mintBatons: []
          },
          nft: {
            tokens: []
          }
        }
      }

      const result = await uut.generateBurnTx(flags)

      assert.include(result, '020000000')
    })

    it('should throw an error if there are no BCH UTXOs to pay for tx', async () => {
      try {
        const flags = {
          walletName: 'test123',
          qty: 0.01,
          tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'
        }

        // Mock dependencies and force desired code path
        sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

        // Instantiate the wallet and bch-js
        await uut.openWallet(flags)

        // Force empty bchUtxos.
        uut.wallet.utxos.utxoStore.bchUtxos = []

        await uut.generateBurnTx(flags)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'No BCH UTXOs available to pay for transaction.')
      }
    })

    it('should throw an error if no token UTXOs match the token ID', async () => {
      try {
        const flags = {
          walletName: 'test123',
          qty: 0.01,
          tokenId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        }

        // Mock dependencies and force desired code path
        sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

        // Instantiate the wallet and bch-js
        await uut.openWallet(flags)

        // Force UTXOs with no matching token:
        uut.wallet.utxos.utxoStore = {
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
              mintBatons: [],
              tokens: []
            },
            group: {
              tokens: [],
              mintBatons: []
            },
            nft: {
              tokens: []
            }
          }
        }

        await uut.generateBurnTx(flags)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'No token UTXOs found for token ID')
      }
    })

    it('should throw an error if BCH UTXO does not have enough satoshis', async () => {
      try {
        const bchUtxo = {
          height: 744046,
          tx_hash: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
          tx_pos: 3,
          value: 600,
          txid: '227354c9827f4e3c9ce24dd9197b314f7da8a2224f4874ca11104c8fdc58f684',
          vout: 3,
          address: 'bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h',
          isSlp: false,
          satoshis: 600
        }

        const tokenUtxo = {
          height: 700522,
          tx_hash: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
          tx_pos: 1,
          value: 546,
          txid: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
          vout: 1,
          utxoType: 'token',
          tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
          tokenTicker: 'TROUT',
          tokenName: "Trout's test token",
          decimals: 2,
          tokenType: 1,
          tokenQty: '4.25',
          qtyStr: '4.25'
        }

        const flags = {
          walletName: 'test123',
          qty: 0.01,
          tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'
        }

        // Mock dependencies and force desired code path
        sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

        // Instantiate the wallet and bch-js
        await uut.openWallet(flags)

        // Force UTXOs with low value BCH UTXO:
        uut.wallet.utxos.utxoStore = {
          bchUtxos: [bchUtxo],
          slpUtxos: {
            type1: {
              mintBatons: [],
              tokens: [tokenUtxo]
            },
            group: {
              tokens: [],
              mintBatons: []
            },
            nft: {
              tokens: []
            }
          }
        }

        await uut.generateBurnTx(flags)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'Selected UTXO does not have enough satoshis')
      }
    })

    it('should handle multiple token UTXOs for the same token ID', async () => {
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

      const tokenUtxo1 = {
        height: 700522,
        tx_hash: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
        tx_pos: 1,
        value: 546,
        txid: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
        vout: 1,
        utxoType: 'token',
        tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
        tokenTicker: 'TROUT',
        tokenName: "Trout's test token",
        decimals: 2,
        tokenType: 1,
        tokenQty: '2.00',
        qtyStr: '2.00'
      }

      const tokenUtxo2 = {
        height: 700523,
        tx_hash: 'bb5691b50930816be78dad76d203a1c97ac94c03f6051b2fa0159c71c43aa3d0',
        tx_pos: 1,
        value: 546,
        txid: 'bb5691b50930816be78dad76d203a1c97ac94c03f6051b2fa0159c71c43aa3d0',
        vout: 1,
        utxoType: 'token',
        tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
        tokenTicker: 'TROUT',
        tokenName: "Trout's test token",
        decimals: 2,
        tokenType: 1,
        tokenQty: '2.25',
        qtyStr: '2.25'
      }

      const flags = {
        walletName: 'test123',
        qty: 0.01,
        tokenId: 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2'
      }

      // Mock dependencies and force desired code path
      sandbox.stub(uut.walletUtil, 'instanceWallet').resolves(mockWallet)

      // Instantiate the wallet and bch-js
      await uut.openWallet(flags)

      // Force UTXOs with multiple token UTXOs:
      uut.wallet.utxos.utxoStore = {
        bchUtxos: [bchUtxo],
        slpUtxos: {
          type1: {
            mintBatons: [],
            tokens: [tokenUtxo1, tokenUtxo2]
          },
          group: {
            tokens: [],
            mintBatons: []
          },
          nft: {
            tokens: []
          }
        }
      }

      const result = await uut.generateBurnTx(flags)

      assert.include(result, '020000000')
    })
  })

  describe('#run', () => {
    it('should execute the run function', async () => {
      // Mock dependencies
      uut.wallet = new MinimalSlpWalletMock()
      sandbox.stub(uut, 'validateFlags').returns(true)
      sandbox.stub(uut, 'openWallet').resolves(mockWallet)
      sandbox.stub(uut, 'generateBurnTx').resolves('fake-hex')

      const result = await uut.run({})

      assert.equal(result, true)
    })

    it('should handle an error', async () => {
      const result = await uut.run()

      assert.equal(result, 0)
    })
  })
})
