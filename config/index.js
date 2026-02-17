/*
  Configure your CLI app with these settings.
  Modify these values to suite your needs.

  More info at https://CashStack.info
*/

const config = {
  // The REST URL for the server used by minimal-slp-wallet.
  restURL: 'https://free-bch.fullstack.cash',
  // restURL: 'https://dev-consumer.psfoundation.info',
  // restURL: 'https://x402-bch.fullstack.cash/v5/',

  // consumer-api = web 3 Cash Stack (ipfs-bch-wallet-consumer)
  // rest-api = web 2 Cash Stack (bch-api)
  interface: 'consumer-api'

  // x402 Payment Protocol settings.
  // To use x402, set interface to 'rest-api', restURL to
  // 'https://x402-bch.fullstack.cash/v5/', and provide a WIF private key
  // for an address funded with BCH.
  // x402wif: 'L...', // WIF private key for x402 payments
  // paymentAmountSats: 10000, // satoshis per x402 payment (default: 10000)
  // bchServerURL: 'https://bch.fullstack.cash/v6/' // BCH server for broadcasting x402 payments
}

export default config
