/*
  Unit tests for the wallet-list command.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import { promises as fs } from 'fs'

// Local libraries
import WalletCreate from '../../../src/commands/wallet-create.js'
import WalletList from '../../../src/commands/wallet-list.js'

const __dirname = import.meta.dirname
const filename = `${__dirname.toString()}/../../../.wallets/test123.json`

describe('#wallet-list', () => {
  let sandbox
  let uut

  beforeEach(async () => {
    sandbox = sinon.createSandbox()

    uut = new WalletList()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#parseWallets', () => {
    it('should correctly parse wallet data', async () => {
      // Create a mainnet wallet.
      const createWallet = new WalletCreate()
      await createWallet.createWallet(filename)

      const data = await uut.parseWallets()
      // console.log('data: ', data)

      // Find the wallet that was just created.
      const testWallet = data.find(wallet => wallet[0].indexOf('test123') > -1)
      // console.log('testWallet: ', testWallet)

      assert.include(testWallet[0], 'test123')

      // Clean up
      await fs.rm(filename)
    })

    it('should return empty array on missing wallets data', async () => {
      // Force shelljs.ls to return an empty array.
      sandbox.stub(uut.shelljs, 'ls').returns([])

      let data

      try {
        data = await uut.parseWallets()
      } catch (error) {
        assert.equal(data, [], 'Empty array')
        assert.equal(error, 'No wallets found.', 'Proper error message')
      }
    })
  })

  describe('#run', () => {
    it('should display wallets table', async () => {
      const createWallet = new WalletCreate()
      await createWallet.createWallet(filename, 'test wallet')

      // Promise.resolve(uut.run()).then(function (table) {
      //   assert.include(table, 'Name')
      //   assert.include(table, 'Balance (BCH)')
      // })

      sinon.stub(uut, 'parseWallets').resolves({})
      sandbox.stub(uut, 'displayTable').resolves('')

      // Clean up
      await fs.rm(filename)

      const result = await uut.run()

      assert.equal(result, true)
    })

    it('should return 0 on error', async () => {
      // Force an error
      sandbox.stub(uut, 'parseWallets').throws(new Error('test error'))

      const result = await uut.run()

      assert.equal(result, 0)
    })
  })

  describe('#displayTable', () => {
    it('should display the data in a console table', () => {
      const walletData = [
        [
          'msg1',
          'Used for sending and receiving messages'
        ],
        [
          'msg2',
          'Used for sending and receiving message'
        ]
      ]

      const tableStr = uut.displayTable(walletData)

      assert.isString(tableStr)
    })
  })
})
