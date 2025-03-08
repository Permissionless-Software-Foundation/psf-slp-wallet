/*
  Unit tests for the token-info command
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Local libraries
import TokenInfo from '../../../src/commands/token-info.js'
import WalletServiceMock from '../../mocks/wallet-service-mock.js'

describe('#token-info', () => {
  let uut
  let sandbox

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new TokenInfo()
    uut.BchWallet = WalletServiceMock
    uut.wallet = new WalletServiceMock()
  })

  afterEach(() => {
    sandbox.restore()
  })

  // after(async () => {
  //   await fs.rm(filename)
  // })

  describe('#validateFlags()', () => {
    it('should return true if all arguments are included', () => {
      const flags = {
        tokenId: 'abc123'
      }

      assert.equal(uut.validateFlags(flags), true, 'return true')
    })

    it('should throw error if tokenId is not supplied.', () => {
      try {
        const flags = {}
        uut.validateFlags(flags)
      } catch (err) {
        assert.include(
          err.message,
          'You must specify a token ID with the -t flag',
          'Expected error message.'
        )
      }
    })
  })

  describe('#getTokenData', () => {
    it('should get token data', async () => {
      const flags = {
        tokenId: 'abc'
      }

      const result = await uut.getTokenData(flags)

      assert.isObject(result, 'Expected Object as Result')
    })
  })

  describe('#summarizeData', () => {
    it('should summarize the genesis data', () => {
      // Mock data
      const tokenData = {
        genesisData: {
          decimals: 2,
          tokensInCirculationStr: '100097954686',
          totalBurned: '2045314',
          totalMinted: '100100000000'
        }
      }

      const result = uut.summarizeData(tokenData)
      // console.log(result)

      assert.equal(result.tokensInCirculation, 1000979546.86)
      assert.equal(result.totalBurned, 20453.14)
      assert.equal(result.totalMinted, 1001000000)
    })
  })

  describe('#getIpfsData', () => {
    it('should get IPFS data from a gateway', async () => {
      // Mock network calls
      sandbox.stub(uut.wallet, 'cid2json').resolves({ json: { schema: 'schema version' } })

      const ipfsUri = 'ipfs://bafybeicp4n4jxm6z6yuftlqvkrgxj3elzctnjn2ufmwz7ivijfowleg6j4'

      const result = await uut.getIpfsData(ipfsUri)
      // console.log(result)

      assert.isObject(result, 'Expected Object as Result')
      assert.property(result, 'schema', 'Expected schema property')
      assert.equal(result.schema, 'schema version', 'Expected schema version')
    })

    it('should return "not-available" if ipfs URI is not found', async () => {
      const ipfsUri = 'blah'

      const result = await uut.getIpfsData(ipfsUri)

      assert.equal(result, 'not available')
    })
    it('should return "not-available" on error', async () => {
      // Mock network calls
      sandbox.stub(uut.wallet, 'cid2json').throws(new Error('test error'))

      const ipfsUri = 'ipfs://bafybeicp4n4jxm6z6yuftlqvkrgxj3elzctnjn2ufmwz7ivijfowleg6j4'

      const result = await uut.getIpfsData(ipfsUri)

      assert.equal(result, 'not available')
    })
  })

  describe('#displayData', () => {
    it('should display the final data', () => {
      const allData = {
        tokenData: 'a',
        dataSummary: 'b',
        immutableData: 'c',
        mutableData: 'd'
      }

      const result = uut.displayData(allData)

      assert.equal(result, true)
    })
  })

  describe('#run', () => {
    it('should execute the run function', async () => {
      // Mock dependencies
      sandbox.stub(uut, 'validateFlags').returns(true)
      sandbox.stub(uut, 'getTokenData').resolves({})
      sandbox.stub(uut, 'summarizeData').returns({})
      sandbox.stub(uut, 'getIpfsData').resolves({})
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
