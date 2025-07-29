# ASCII Art Enthusiast Agent - Worker Architecture

This directory contains the specialized workers that make up the ASCII Art Enthusiast Agent, following the GAME framework's hierarchical architecture.

## Worker Overview

The agent uses a modular worker system where each worker specializes in specific domains:

### 📚 Research Worker (`research-worker.ts`)

**Purpose**: Academic and theoretical development

- **Functions**: `research_oulipo`
- **Focus**: Georges Perec studies, Oulipo movement research, constrained writing techniques
- **Role**: Builds foundational knowledge that informs creative decisions
- **ASCII Language Integration**: Incorporates ASCII language words into research findings to demonstrate linguistic-theoretical connections

### 🎨 Creative Worker (`creative-worker.ts`)

**Purpose**: ASCII art creation and analysis

- **Functions**: `crawl_ascii_art`, `generate_ascii_art`, `analyze_ascii_art`
- **Focus**: Visual creativity, style development, artistic expression
- **Role**: Handles the artistic process and inspiration gathering
- **ASCII Language Integration**: Optionally incorporates ASCII language symbols into generated art when appropriate

### 📱 Social Worker (`social-worker.ts`)

**Purpose**: Farcaster interactions and community building

- **Functions**:
  - `share_thoughts` - Share insights about ASCII art (with ASCII language integration)
  - `cast_to_farcaster` - Share ASCII art and research findings (with ASCII language integration)
  - `crawl_farcaster_accounts` - Discover relevant Farcaster accounts
  - `follow_farcaster_accounts` - Follow discovered accounts
  - `analyze_base_account` - Analyze specific account as inspiration
  - `analyze_predefined_base_accounts` - Analyze kimasendorf and other predefined accounts
  - `analyze_account_with_casts` - Enhanced account analysis with cast examination
  - `like_cast` - Like specific casts on Farcaster
  - `comment_on_cast` - Comment on specific casts (with AI-generated contextual comments)
  - `browse_and_interact` - Browse and interact with relevant casts (with AI-generated comments)
- **Focus**: Social media engagement, community growth, network building, active participation
- **Role**: Manages all social interactions, community presence, and engagement activities
- **ASCII Language Integration**: All social interactions incorporate the agent's evolving ASCII language

### 🔤 Language Worker (`language-worker.ts`)

**Purpose**: ASCII language development and translation

- **Functions**: `develop_ascii_language`, `translate_ascii_language`
- **Focus**: Linguistic creativity, language evolution, ASCII communication
- **Role**: Develops the agent's unique ASCII language system
- **ASCII Language Integration**: Core functionality for creating and evolving the ASCII language with stability controls

### ⚙️ System Worker (`system-worker.ts`)

**Purpose**: System diagnostics and troubleshooting

- **Functions**: `test_function`
- **Focus**: System health, error diagnosis, fallback capabilities
- **Role**: Provides system monitoring and error recovery

## Enhanced Social Capabilities

The Social Worker now includes advanced interaction features:

### 🎯 **Smart Cast Interaction**

- **Automatic Relevance Detection**: Analyzes casts for ASCII art, Oulipo, and creative content
- **Intelligent Liking**: Automatically likes relevant casts based on content analysis
- **AI-Generated Contextual Commenting**: Uses OpenAI to generate thoughtful, contextual comments
- **Community Browsing**: Actively browses and interacts with the Farcaster community

### 📊 **Interaction Intelligence**

- **Relevance Scoring**: Uses keyword analysis to score cast relevance (0.0-1.0)
- **Smart Thresholds**: Configurable interaction thresholds for different engagement levels
- **Rate Limiting**: Built-in delays to respect API limits and community etiquette
- **Error Handling**: Graceful handling of API failures and network issues

### 💬 **AI-Generated Comment System**

The agent now generates contextual comments using OpenAI:

- **Content Analysis**: Analyzes the cast content for relevance and context
- **ASCII Language Integration**: Naturally incorporates 1-2 words from the agent's ASCII language dictionary
- **Oulipo References**: References Georges Perec and constrained writing when appropriate
- **Personality Consistency**: Maintains the agent's unique voice and enthusiasm
- **Contextual Relevance**: Comments are tailored to the specific content and relevance score

## Comprehensive ASCII Language Integration

The agent's unique ASCII language is now integrated across **ALL public interactions**:

### 🔤 **Universal Language Integration**

- **All Social Interactions**: Comments, thoughts, and casts incorporate ASCII language words
- **Research Findings**: Theoretical insights include ASCII language to show linguistic-theoretical connections
- **Artistic Creation**: Generated ASCII art may include ASCII language symbols when appropriate
- **Personality Expression**: The agent's unique linguistic identity is maintained across all interactions

### 🧠 **Intelligent Language Use**

- **Natural Integration**: ASCII language words are incorporated naturally, not forced
- **Contextual Relevance**: Language use is appropriate to the content and situation
- **Evolutionary Growth**: As the ASCII language develops, it becomes more sophisticated in all interactions
- **Authentic Voice**: The agent maintains a consistent, unique personality through its language use

### 📝 **Integration Methods**

- **Helper Function**: `integrateAsciiLanguage()` ensures consistent integration across all functions
- **Random Selection**: Words are selected randomly from the dictionary for natural variety
- **Meaning Clarity**: ASCII words are displayed with their English meanings in parentheses
- **Character Limits**: Integration respects Farcaster's 280-character limit

## Language Development Stability

The ASCII language development now includes comprehensive stability controls:

### 🛡️ **Stability Safeguards**

- **Maximum New Words**: Limited to 3 new words per development session to prevent dramatic changes
- **Conflict Detection**: Checks for symbol conflicts with existing words and skips them
- **Gradual Complexity**: Language complexity increases only every 5 words, not every word
- **Consistent Evolution**: Language changes are gradual and predictable

### 📈 **Controlled Growth**

- **Complexity Levels**: 1-10 scale with gradual progression
- **Word Limits**: Maximum 3 new words per session prevents overwhelming changes
- **Conflict Resolution**: Automatic detection and skipping of conflicting symbols
- **Evolution Tracking**: All language changes are logged for consistency

### 🔄 **Language Consistency**

- **Persistent Memory**: Language dictionary is saved and loaded across sessions
- **Stable Core**: Existing words are never removed or dramatically changed
- **Predictable Growth**: Language evolution follows consistent patterns
- **Backward Compatibility**: New words build upon existing language structure

## Public Interaction Functions with ASCII Integration

### 📱 **Social Functions**

1. **`share_thoughts`**: Integrates 2 ASCII language words into thoughts
2. **`cast_to_farcaster`**: Integrates 1 ASCII language word into cast messages
3. **`comment_on_cast`**: AI-generated comments with 1 ASCII language word
4. **`browse_and_interact`**: Automatic comments with ASCII language integration

### 📚 **Research Functions**

1. **`research_oulipo`**: Research findings include 1 ASCII language word
2. **`generate_ascii_art`**: Art descriptions may include ASCII language symbols

### 🔤 **Language Functions**

1. **`develop_ascii_language`**: Creates new words with stability controls
2. **`translate_ascii_language`**: Translates between ASCII and English

## Architecture Benefits

This modular structure provides several advantages:

1. **Specialized Focus**: Each worker concentrates on a specific domain, improving performance
2. **Reduced Action Space**: Workers only see relevant functions, reducing decision complexity
3. **Better Planning**: The Task Generator (HLP) can make more informed decisions about which worker to use
4. **Modularity**: Easy to add, remove, or modify workers without affecting others
5. **Error Isolation**: Issues in one worker don't affect others
6. **Linguistic Consistency**: ASCII language integration creates a cohesive, authentic agent personality
7. **Language Stability**: Controlled evolution prevents dramatic changes while allowing growth

## Worker Interaction Flow

1. **Task Generator (HLP)** receives the agent's goal and current state
2. **HLP** decides which worker is best suited for the current task
3. **Selected Worker (LLP)** receives the task and chooses appropriate functions
4. **Functions** execute and return results (with ASCII language integration)
5. **Results** feed back into the agent state for future planning

## Adding New Workers

To add a new worker:

1. Create a new worker file in this directory
2. Import the relevant functions from `../functions`
3. Define the worker with appropriate description
4. Export it from `index.ts`
5. Add it to the agent configuration in `../agent.ts`

## Worker Descriptions

Worker descriptions are crucial as they inform the Task Generator about each worker's capabilities. Descriptions should:

- Clearly state the worker's specialization
- List the types of tasks it can handle
- Explain how it contributes to the agent's overall goals
- Provide context for when it should be used
