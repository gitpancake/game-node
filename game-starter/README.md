# ASCII Art Enthusiast Agent

### An autonomous ASCII art enthusiast agent built with the G.A.M.E SDK

This agent is an ASCII art enthusiast that:

- 🕷️ **Crawls the web** for ASCII art examples and inspiration
- 💭 **Shares thoughts** about ASCII art every 30 seconds
- 🎨 **Generates original ASCII art** with a developing personal style
- 🔍 **Analyzes ASCII art** to learn new techniques and improve skills
- 🧠 **Develops a unique artistic style** over time through practice and observation
- 📱 **Casts to Farcaster** when it creates art it's proud of, sharing with the community
- 📚 **Researches Georges Perec and Oulipo movement** to draw inspiration from constrained writing and mathematical creativity
- 💾 **Maintains persistent memory** across script restarts, preserving artistic development and research
- 🔤 **Develops its own ASCII language** over time using Oulipo constraints and principles
- 🌐 **Discovers and follows Farcaster accounts** related to ASCII art and creative communities
- 🎯 **Analyzes base inspiration accounts** to understand their style and discover their network

To get an API KEY <https://console.game.virtuals.io/>

Available packages:
Python: <https://github.com/game-by-virtuals/game-python>
Typescript: <https://github.com/game-by-virtuals/game-node>
NPM: <https://www.npmjs.com/package/@virtuals-protocol/game>

## Prerequisites

- nvm
- git
- node

required environment variables:

- GAME_API_KEY : API key for the GAME framework, <https://docs.game.virtuals.io/game-sdk>
- OPENAI_API_KEY: API key for the OpenAI API, get it from <https://platform.openai.com/api-keys>
- NEYNAR_API_KEY: API key for Neynar (Farcaster integration), get it from <https://neynar.com/>
- FARCASTER_SIGNER_UUID: Your Farcaster signer UUID for casting, get it from <https://neynar.com/>

### Optional Configuration

- THOUGHT_INTERVAL: Time between thought sharing (default: 30000ms = 30 seconds)
- API_RATE_LIMIT: Time between API calls (default: 10000ms = 10 seconds)

### Setting up Neynar for Farcaster Casting

1. **Get Neynar API Key**: Visit [neynar.com](https://neynar.com/) and create an account to get your API key
2. **Create a Farcaster Signer**: Use Neynar's managed signers to create a signer for your Farcaster account
3. **Get Signer UUID**: Copy the signer UUID from your Neynar dashboard
4. **Add to Environment**: Add both credentials to your `.env` file

### Persistent Memory

The agent maintains its artistic development and research across script restarts using a JSON memory file:

- **Memory File**: `agent_memory.json` (automatically created)
- **Auto-Save**: Every 5 minutes and on graceful shutdown
- **Stored Data**:
  - Art history and style preferences
  - Oulipo research findings
  - Statistics (total art created, thoughts shared, casts made)
  - Techniques and inspirations learned
- **Graceful Shutdown**: Press Ctrl+C to save memory before stopping

### ASCII Language Development

The agent develops its own ASCII language over time, inspired by Oulipo constraints:

- **Language Evolution**: Creates new ASCII symbols and words using Oulipo principles
- **Complexity Levels**: Language grows from Level 1 to 10 as it develops
- **Translation**: Can translate between ASCII language and English
- **Constraints**: Uses mathematical patterns, palindromes, geometric symmetry
- **Integration**: Incorporates ASCII language into thoughts and art
- **Persistent**: Language development is saved and continues across restarts

### Farcaster Network Building

The agent actively builds a network of ASCII art enthusiasts and creative collaborators:

- **Account Discovery**: Searches for Farcaster accounts related to ASCII art, creative coding, and digital art
- **Relevance Analysis**: Analyzes profiles for relevance to ASCII art and creativity
- **Smart Following**: Follows accounts that meet relevance criteria and align with artistic goals
- **Network Statistics**: Tracks discovered accounts and following relationships
- **Community Engagement**: Builds connections with other ASCII art pioneers and enthusiasts

### Base Inspiration Analysis

The agent can analyze specific Farcaster accounts as base inspiration sources:

- **Account Analysis**: Deep analysis of specific accounts' style, content, and approach
- **Network Discovery**: Explores the account's followers and following to find related artists
- **Style Learning**: Understands the artistic approach and techniques of inspiration accounts
- **Community Mapping**: Discovers the broader network around inspiration accounts
- **Inspiration Integration**: Incorporates insights from base accounts into its own artistic development

## To run project

1. Start from the game starter directory
   `cd game-starter`
2. Copy the environment file
   `cp .env.example .env`
3. Place your API key in the ".env" file
4. Start the project with `npm install && npm run build && npm start`
5. Or run with docker compose
   `docker compose up -d`
   **Note** We recommend using nvm version 23 `nvm use 23`

## To run project in TEE

### Phala

1. Build the docker image and publish it to the docker hub

   `docker compose build -t <your-dockerhub-username>/virtuals-game-starter .`

   `docker push <your-dockerhub-username>/virtuals-game-starter`

2. Deploy to Phala cloud using [tee-cloud-cli](https://github.com/Phala-Network/tee-cloud-cli) or manually with the [Cloud dashboard](https://cloud.phala.network/).

3. Check your agent's TEE proof and verify it on the [TEE Attestation Explorer](https://proof.t16z.com/).

### Oasis ROFL

1. To ROFLize your agent, get the [Oasis CLI](https://github.com/oasisprotocol/cli/releases)
   for your OS of choice.

2. Register a new ROFL app and encrypt the secrets inside the `rofl.yaml`
   manifest file:

   ```shell
   oasis rofl create
        echo -n "your_game_api_key_here" | oasis rofl secret set API_KEY -
     echo -n "your_openai_api_key_here" | oasis rofl secret set OPENAI_API_KEY -
   ```

3. Build the docker image and publish it, for example:

   ```shell
   docker build -t docker.io/<your-dockerhub-username>/virtuals-game-starter .
   docker push docker.io/<your-dockerhub-username>/virtuals-game-starter
   ```

   In `rofl-compose.yml` replace `<your-dockerhub-username>` with your actual
   one. To ensure integrity, we strongly suggest to hardcode the image hash reported
   when you pushed the image. For example:

   ```yaml
   services:
     game-starter:
       image: docker.io/rosy/virtuals-game-starter@sha256:25263747e8f9ebc193e403ac009b696ea49459d9d642b86d890de432dae4469f
   ```

4. Build the bundle, submit the obtained Enclave ID and the secrets to
   the chain and deploy it:

   ```shell
   oasis rofl build
   oasis rofl update
   oasis rofl deploy
   ```

5. To check that your ROFL instance is up running and review the TEE proof run:

   `oasis rofl show`

   To independently verify whether the source in front of you matches the
   deployed version of ROFL on-chain invoke:

   `oasis rofl build --verify`

Visit <https://docs.oasis.io/build/rofl/> for documentation. Should you have
any questions reach out to us on #dev-central Discord channel at
<https://oasis.io/discord>.
