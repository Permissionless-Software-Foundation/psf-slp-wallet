/*
Unit tests for the token-tx-history command
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Local libraries
import TokenTxHistory from '../../../src/commands/token-tx-history.js'
import WalletServiceMock from '../../mocks/wallet-service-mock.js'

describe('#token-tx-history', () => {
  let uut
  let sandbox

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new TokenTxHistory()
    uut.BchWallet = WalletServiceMock
    uut.wallet = new WalletServiceMock()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#validateFlags()', () => {
    it('should return true if all arguments are included', () => {
      const flags = { tokenId: 'abc123' }

      assert.equal(uut.validateFlags(flags), true, 'return true')
    })

    it('should throw error if tokenId is not supplied.', () => {
      try {
        const flags = {}
        uut.validateFlags(flags)
      } catch (err) {
        assert.include(err.message, 'You must specify a token ID with the -t flag', 'Expected error message.')
      }
    })
  })

  describe('#getTxHistory', () => {
    it('should get token data', async () => {
      // Mock wallet library
      const flags = { tokenId: 'abc123' }

      sandbox.stub(uut.wallet, 'getTokenData').resolves({
        genesisData: {
          txs: []
        }
      })
      const result = await uut.getTxHistory(flags)
      // console.log(result)

      assert.isArray(result)
    })
    it('should handle request error', async () => {
      try {
        const flags = { tokenId: 'abc123' }

        sandbox.stub(uut.wallet, 'getTokenData').throws(new Error('test error'))
        await uut.getTxHistory(flags)
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#displayTxHistory', () => {
    it('should display the final data', () => {
      const allData = {
        transactions: []
      }

      const result = uut.displayData(allData)

      assert.equal(result, true)
    })
  })

  describe('#run', () => {
    it('should execute the run function', async () => {
      // Mock dependencies
      sandbox.stub(uut, 'validateFlags').returns(true)
      sandbox.stub(uut, 'getTxHistory').resolves({})
      sandbox.stub(uut, 'displayData').returns(true)

      const result = await uut.run()

      assert.equal(result, true)
    })

    it('should handle an error', async () => {
      const result = await uut.run()

      assert.equal(result, 0)
    })
  })
})
