# Alchemy Plugin for Virtuals Protocol

The **Alchemy Plugin** provides a set of functions to retrieve on-chain data from the Alchemy API giving your agent the power to work with web3 data. With this plugin, you can fetch portfolio data—including transaction history, token details, NFT information, and NFT contracts—by querying wallet addresses across various supported networks.

## Features

- **Transaction History:** Retrieve historical transactions for a given EVM wallet.
- **Tokens by Wallet:** Get the tokens held by a wallet along with associated metadata and prices.
- **Token Balances by Wallet:** Fetch current token balances for a wallet.
- **NFTs by Wallet:** Retrieve NFTs currently owned by a wallet, with optional paging and metadata.
- **NFT Contracts by Wallet:** Retrieve distinct NFT contracts (collections) owned by a wallet, including metadata.

## Installation

The plugin comes in the `plugins` directory at the root of `game-node` official repo.

## Usage

An example of how to instantiate the plugin and create an agent is given in `src/example.ts` file.

All you need to do is run these commands at the root of `alchemyPlugin`:

- `npm install`
- `npm run build`
- `node dist/example.js`


## Development

Feel free to modify or extend the plugin as needed. Contributions, bug reports, and feature requests are welcome!

1. Fork the repository.
2. Create a new branch with your feature or bug fix.
3. Submit a pull request with detailed descriptions of your changes.
