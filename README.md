# MeetAI 📞🤖

**Live Demo:** [https://meetai-steel.vercel.app](https://meetai-steel.vercel.app)

MeetAI is a full-stack mock-call meeting platform where users can create AI agents, engage in one-on-one meetings, and access detailed summaries, transcripts, and contextual chats — all powered by modern web technologies and **Groq language models**.

---

## 🛠 Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

---

## ⚙️ Tech Stack

- **Next.js** with Server-Side Rendering (SSR)
- **tRPC** Architecture
- **Drizzle ORM** + **Neon Database**
- **ShadCN UI** Components
- **Better Auth** for authentication
- **Polar** for subscription management (monthly/yearly, sandbox-ready)
- **Groq** LLMs for agent responses

---

## 🧩 Core Features

- **Agents**
  - Create up to 10 custom agents (free tier)
  - Edit agent name and instructions
  - Delete agents

- **Meetings**
  - Create up to 10 meetings (free tier)
  - Add meeting name and schedule agents
  - Join/hold/resume/end meetings
  - Hold meetings retain full context
  - On end: automatic transcription, summary, and chat features
  - Edit meetings (if not started)
  - Delete or mark meetings as complete

- **Call UI**
  - Mock 1-on-1 call (not real-time)
  - Real-time speech-to-text (user) and browser TTS (agent)

---

## 💡 Architecture Overview

- User speech is converted to text via browser speech recognition
- Query + instructions sent to backend with full conversation history
- Groq LLM generates a response
- Agent speaks using browser text-to-speech
- All interactions are stored for summaries, transcripts, and chat

---

## 🚧 Known Issues

- ❌ **Mobile browsers**: Agent speech (TTS) does not play audio
- 📱 Minor responsive layout issues on smaller screens
- ⚠️ **Polar** integration: Cannot access billing page or change plan page (code correct, known issue)
- 🔉 Speech recognition may occasionally misinterpret user inputs

