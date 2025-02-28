/*
  List available wallets.
*/

// Global npm libraries
import shelljs from 'shelljs'
import Table from 'cli-table'
import { readFile } from 'fs/promises'

// Global variables
const __dirname = import.meta.dirname

class WalletList {
  constructor () {
    // Encapsulate dependencies
    this.shelljs = shelljs
    this.Table = Table

    // Bind 'this' object to all subfunctions.
    this.run = this.run.bind(this)
    this.parseWallets = this.parseWallets.bind(this)
    this.displayTable = this.displayTable.bind(this)
  }

  async run (flags) {
    try {
      const walletData = await this.parseWallets()
      // console.log(`walletData: ${JSON.stringify(walletData, null, 2)}`)

      this.displayTable(walletData)

      return true
    } catch (err) {
      console.error('Error in wallet-list: ', err)
      return 0
    }
  }

  // Parse data from the wallets directory into a formatted array.
  async parseWallets () {
    const fileList = this.shelljs.ls(
      `${__dirname.toString()}/../../.wallets/*.json`
    )
    // console.log('fileList: ', fileList)

    if (fileList.length === 0) {
      console.log('No wallets found.')
      return []
    }

    const retData = []

    // Loop through each wallet returned.
    for (let i = 0; i < fileList.length; i++) {
      const thisFile = fileList[i]
      // console.log(`thisFile: ${thisFile}`)

      const lastPart = thisFile.indexOf('.json')

      const lastSlash = thisFile.indexOf('.wallets/') + 1
      // console.log(`lastSlash: ${lastSlash}`)

      let name = thisFile.slice(8, lastPart)
      // console.log(`name: ${name}`)

      name = name.slice(lastSlash)

      // Read the contents of the wallet file.
      const walletStr = await readFile(thisFile)
      const walletInfo = JSON.parse(walletStr)

      retData.push([name, walletInfo.wallet.description])
    }

    return retData
  }

  // Display table in a table on the command line using cli-table.
  displayTable (data) {
    const table = new Table({
      head: ['Name', 'Description'],
      colWidths: [25, 55]
    })

    for (let i = 0; i < data.length; i++) table.push(data[i])

    const tableStr = table.toString()

    // Cut down on screen spam when running unit tests.
    console.log(tableStr)

    return tableStr
  }
}

export default WalletList
