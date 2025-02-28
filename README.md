# psf-bch-wallet

This is the third major version (v3) of psf-bch-wallet command-line wallet for Bitcoin Cash (BCH) and SLP tokens.

Version 2 is archived in the [psf-bch-wallet-v2](https://github.com/Permissionless-Software-Foundation/psf-bch-wallet-v2) repository.

## Installation

This software requires node.js v20 or higher. Instructions for installation:

- `git clone https://github.com/Permissionless-Software-Foundation/psf-bch-wallet`
- `cd psf-bch-wallet`
- `npm install`

## Usage

### Display Help

- `node psf-bch-wallet.js help`

### Wallet Commands

#### Create a Wallet

Create a new BCH wallet:

- `node psf-bch-wallet.js wallet-create -n wallet1 -d "My first wallet"`

##### Arguments
- Use the `-n` flag to give your wallet a name (required).
- And the `-d` flag to give it a description (optional).


#### List Wallets

List the wallets managed by this application:

- `node psf-bch-wallet.js wallet-list`

##### Arguments:
- none


#### Wallet Addresses

Display the addresses for receiving funds to this wallet:

- `node psf-bch-wallet.js wallet-addrs -n wallet1`

##### Arguments:

- Use the `-n` flag to specify which wallet to use (required).


#### Wallet Balance

Check the balance of BCH and SLP tokens held by this wallet.

- `node psf-bch-wallet.js wallet-balance -n wallet1`

##### Arguments:

- Use the `-n` flag to specify the wallet to check (required).


### Send Cryptocurrency

Use these commands to send BCH and SLP tokens.

#### Send BCH

Send BCH from the wallet to another address.

- `node psf-bch-wallet.js send-bch -n wallet1 -q 0.00001 -a bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl`

##### Arguments:
- Use the `-n` flag to specify the wallet holding BCH (required).
- Use the `-q` flag to specify the quantity to send in BCH (required).
- Use the `-a` flag to specify the receiver of the BCH (required).


#### Send SLP Tokens

Send an SLP token from the wallet to another address.

- `node psf-bch-wallet.js send-tokens -n wallet1 -q 0.5 -a simpleledger:qrnwvazrjzytmlv9wyvj4pkkc9k2l0fhvs8u479asy -t 38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0`

##### Arguments:
- Use the `-n` flag to specify the wallet holding tokens (required).
- Use the `-q` flag to specify the quantity of tokens to send (required).
- Use the `-a` flag to specify the receiver of the tokens (required).
- Use the `-t` flag to specify the token ID of the token to send (required).


### Cryptography

Use these commands to sign a message to prove ownership of a BCH address, and conversely to verify that a signature is valid.

#### Sign Message

Sign a message with the private key of a wallet.

- `node psf-bch-wallet.js msg-sign -n wallet1 -m "test message"`

##### Arguments:
- Use the `-n` flag to specify the wallet holding tokens (required).
- Use the `-m` flag to specify a message to sign (required).

#### Verify Signature

Use a signed message to verify that the send possess the private key associated
with the public address.

- `node psf-bch-wallet.js msg-verify -a bitcoincash:qr2zqrnqdulfmeqs2qe9c5p605lrwe90v5v735s2jl -m "This is a test message" -s IOdfv+TQNCNIEJ4uvcUJmX9ZCEbkNNv9ad+TLO/JJxzeWDhqx42iBXMPEnthldl9wGx/Fwdjwp1w9532mSXzENM=`

##### Arguments:
- Use the `-a` flag to specify the BCH address you are verifying ownership of (required).
- Use the `-m` flag to specify the clear text message that was signed (required).
- Use the `-s` flag to specify the signature to be verified (required).


## Change History

psf-bch-wallet v2 became too large in scope and as a result the code base grew too complex. The code was also stuck in CommonJS format. Version 3 uses ESM format, and strives to create a much simpler code base, which can be forked to add on new use-cases and thereby grow in scope in a more controlled fashion.

v2 also used the [oclif CLI framework](https://oclif.io/), which no longer provides good support for JavaScript-native software. v3 has switched to the [Commander.js](https://github.com/tj/commander.js/) library.
