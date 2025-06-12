# psf-slp-wallet

This is a command-line interface (CLI) application for creating and managing Simple Ledger Protocol (SLP) tokens.

This is a fork of [psf-bch-wallet](https://github.com/Permissionless-Software-Foundation/psf-bch-wallet). This CLI has all the same commands as that one, plus additional commands for managing SLP tokens.

## Tutorial Videos

- [Create a simple fungible token](https://www.youtube.com/watch?v=gjgeUIWekoA)

## Installation

This software requires node.js v20 or higher. Instructions for installation:

- `git clone https://github.com/Permissionless-Software-Foundation/psf-slp-wallet`
- `cd psf-slp-wallet`
- `npm install`

## Usage

### Display Help

- `node psf-slp-wallet.js help`

### SLP Token Commands

#### Token Info

Get information about an SLP token. Outputs a JSON object with token metadata.

- `node psf-slp-wallet.js token-info -t 1d542ac6b26a2c85a892b79b7ec39dfba5c731b95c644cf5aef75e580f5c7660`

##### Arguments
- Use the `-t` flag to specify the token ID of the token to get information about (required).


#### Token Transaction History

Get the transaction history for an SLP token. Outputs a JSON object with the transaction history.

- `node psf-slp-wallet.js token-tx-history -t 1d542ac6b26a2c85a892b79b7ec39dfba5c731b95c644cf5aef75e580f5c7660`

##### Arguments
- Use the `-t` flag to specify the token ID of the token to get the transaction history for (required).


#### Create a Fungible Token

Create a new SLP Type1 fungible token.

- `node psf-slp-wallet.js token-create-fungible -n wallet1 -m "My Token" -t MYTOK -d 8 -q 100000000`

##### Arguments
- Use the `-n` flag to specify the name of the wallet (required).
- Use the `-m` flag to specify the name of the token (required).
- Use the `-t` flag to specify the ticker of the token (required).
- Use the `-d` flag to specify the number of decimals of the token (required).
- Use the `-q` flag to specify the quantity of tokens to create (required).

#### Create a Group Token

Create a new SLP Group token.

- `node psf-slp-wallet.js token-create-group -n wallet1 -m "My Group Token" -t MYGT`

##### Arguments
- Use the `-n` flag to specify the name of the wallet (required).
- Use the `-m` flag to specify the name of the token (required).
- Use the `-t` flag to specify the ticker of the token (required).
- Use the `-q` flag to specify the quantity of tokens to create (optional).
- Use the `-u` flag to specify the url of tokens to create (optional).
- Use the `-h` flag to specify the hash of tokens to create (optional).


#### Create NFT

Create a new NFT.

- `node psf-slp-wallet.js token-create-nft -n wallet1 -m "My NFT" -t MNFT -i 9921cd7d19ca536e595f69a89fbc73e10cc446a7fe80acb3d78bd2b036997fe2`

##### Arguments
- Use the `-n` flag to specify the name of the wallet (required).
- Use the `-m` flag to specify the name of the token (required).
- Use the `-t` flag to specify the ticker of the token (required).
- Use the `-i` flag to specify the Group token to burn, to generate the NFT (required).
- Use the `-u` flag to specify the url of tokens to create (optional).
- Use the `-h` flag to specify the hash of tokens to create (optional).

#### Mint Tokens

Mint new Fungible (Type 1) or Group tokens.

- `node psf-slp-wallet.js token-mint -n wallet1 -q 1 -t 1d542ac6b26a2c85a892b79b7ec39dfba5c731b95c644cf5aef75e580f5c7660`   

##### Arguments
- Use the `-n` flag to specify the name of the wallet (required).
- Use the `-q` flag to specify the quantity of tokens to create (required).
- Use the `-t` flag to specify the token ID of the token to mint (required).
- Use the `-r` flag to specify the receiver of the new baton (optional).    

#### Create Mutable Data Address (MDA)

Create a new Mutable Data Address (MDA) for a token.

- `node psf-slp-wallet.js token-mda-tx -n wallet1 -a bitcoincash:qr2u4f2dmva6yvf3npkd5lquryp09qk7gs5vxl423h`

##### Arguments
- Use the `-n` flag to specify the name of the wallet to pay for transaction (required).
- Use the `-a` flag to specify the Mutable Data Address (MDA) (required).


