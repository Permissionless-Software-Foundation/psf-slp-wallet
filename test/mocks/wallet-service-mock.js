/*
  A mocked version of the wallet-service.js library.
  This mock does not make network calls, but returns hard-coded data for tests.
*/

class WalletService {
  checkServiceId () {
    return 'serviceId'
  }

  async getBalances (addrs) {
    return {}
  }

  async getUtxos (addr) {
    return {}
  }

  async sendTx (hex) {
    return {}
  }

  async getTokenData () {
    return {}
  }

  async cid2json () {
    return {}
  }
}

// module.exports = WalletService
export default WalletService
