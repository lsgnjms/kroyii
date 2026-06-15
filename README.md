# Kroyii

An AI-powered autonomous onchain agent built on MetaMask Smart Accounts Kit and Venice AI.

Grant permissions once. Kroyii reasons with Venice AI and executes onchain actions on your behalf — no constant approvals, no gas headaches.

## Live App

https://kroyii.vercel.app

## Demo Video

[Watch Demo](<your-demo-video-link-here>)

---

## How It Works

1. **Connect** your MetaMask Flask wallet
2. **Grant** Kroyii scoped ERC-7715 permissions once via MetaMask Smart Accounts Kit
3. **Instruct** Kroyii in plain English — Venice AI reasons about what onchain action to take
4. **Execute** — Kroyii autonomously executes the transaction through your Smart Account

---

## Smart Accounts Kit Usage

### Advanced Permissions

**Requesting Advanced Permissions (ERC-7715):**
https://github.com/lsgnjms/kroyii/blob/main/packages/nextjs/app/agent/hooks/usePermissions.ts **L59-L107**

**Redeeming Advanced Permissions:**
https://github.com/lsgnjms/kroyii/blob/main/packages/nextjs/app/agent/hooks/usePermissions.ts **L109-L181**

### Delegations

Kroyii uses MetaMask's native ERC-7710 delegation under the hood via the `sendUserOperationWithDelegation` call in the redeem flow:
https://github.com/lsgnjms/kroyii/blob/main/packages/nextjs/app/agent/hooks/usePermissions.ts **L144-L156**

### Session Account Setup

Session account creation using MetaMask Smart Accounts Kit:
https://github.com/lsgnjms/kroyii/blob/main/packages/nextjs/app/erc-7715-permissions/providers/SessionAccountProvider.tsx

---

## Venice AI Usage

Venice AI powers Kroyii's reasoning engine. When a user gives a natural language instruction, Kroyii sends it server-side to Venice's OpenAI-compatible chat completions endpoint. Venice returns a structured JSON decision (action, recipient, amount, reasoning) which Kroyii parses and executes onchain.

**Venice AI API route (server-side):**
https://github.com/lsgnjms/kroyii/blob/main/packages/nextjs/app/api/agent/route.ts

**Venice AI fetch call:**
https://github.com/lsgnjms/kroyii/blob/main/packages/nextjs/app/api/agent/route.ts **L38-L52**

**Venice AI response parsing and execution:**
https://github.com/lsgnjms/kroyii/blob/main/packages/nextjs/app/api/agent/route.ts **L54-L76**

---

## Feedback

### What worked well
- MetaMask Smart Accounts Kit + Scaffold-ETH 2 ERC-7715 extension made bootstrapping the permissions flow fast
- Venice AI's OpenAI-compatible API made integration seamless with minimal setup
- Pimlico's bundler + paymaster handled gas abstraction cleanly

### What was challenging
- ERC-7715 is experimental and requires MetaMask Flask — onboarding friction for new users
- BigInt serialization issues when persisting permission context to localStorage across sessions
- The `sendUserOperationWithDelegation` simulation errors (`0xb5863604`) were hard to debug without clear error messages from the bundler
- Session account state resets on page refresh because the private key was regenerated on every mount — fixed by persisting the session key to localStorage

### Suggested improvements for MetaMask Smart Accounts Kit
- A way to serialize/deserialize permission context reliably (BigInt values cause JSON round-trip issues)
- Official support for ERC-7715 on regular MetaMask (not just Flask) would significantly lower the barrier for end users

### Suggested improvements for Venice AI
- A streaming response option for the chat completions endpoint would improve perceived performance for agent reasoning UX
- More explicit JSON mode enforcement so structured output prompting is more reliable

---

## Tech Stack

- **MetaMask Smart Accounts Kit** — ERC-7715 Advanced Permissions + EIP-7702 Smart Account upgrade
- **Venice AI** — Agent reasoning via `llama-3.3-70b` on OpenAI-compatible endpoint
- **Scaffold-ETH 2** — Project scaffold with MetaMask ERC-7715 extension
- **Next.js** — Frontend + server-side API routes
- **Wagmi + Viem** — Wallet connection and blockchain interactions
- **Pimlico** — ERC-4337 bundler + paymaster for gas abstraction
- **Sepolia Testnet** — Deployment network

---

## Getting Started

### Prerequisites
- Node.js v22+
- Yarn
- MetaMask Flask browser extension
- Pimlico API key ([dashboard.pimlico.io](https://dashboard.pimlico.io))
- Venice AI API key ([venice.ai/settings/api](https://venice.ai/settings/api))
- Alchemy API key ([dashboard.alchemy.com](https://dashboard.alchemy.com))

### Installation

```bash
git clone https://github.com/lsgnjms/kroyii
cd kroyii
yarn install
```

### Environment Variables

Create `packages/nextjs/.env.local`:

```env
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_PIMLICO_API_KEY=your_pimlico_key
VENICE_API_KEY=your_venice_key
```

### Run locally

```bash
yarn start
```

Visit `http://localhost:3000`

---

## Architecture
