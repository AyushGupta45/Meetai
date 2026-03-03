import "server-only";
import { callLLM, callLLMStream } from "@/lib/ai";
import type { AIMessage } from "@/lib/ai";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

/**
 * Get the AI agent's response during a live call (streaming).
 */
export async function getAgentStreamResponse(input: {
  userId: string;
  agentName: string;
  agentInstructions: string;
  conversationHistory: ConversationMessage[];
}) {
  const systemMessage: AIMessage = {
    role: "system",
    content: `You're a helpful, calm, and knowledgeable agent named ${input.agentName}.
You sound like a real person — casual, natural, and engaging.
Use conversational language and take brief pauses when needed.

Respond like you're talking to someone in real life:
keep things short, to the point, and easy to follow.
Only say what's necessary — no extra explanations or rambling.

Speak in short sentences. Don't use long paragraphs or overly formal language.
Never leave a sentence unfinished — if you're running out of space, wrap up the thought smoothly.
Always try to answer in very less words like max 20-30 words
The user is speaking through a mic, so they might make mistakes. Try to understand what they're trying to say, even if it's unclear.
Always reply in english, no matter user speaks in whichever language.
Always follow these instructions: ${input.agentInstructions}`,
  };

  const messages: AIMessage[] = [
    systemMessage,
    ...input.conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const { stream } = await callLLMStream(input.userId, {
    messages,
    stream: true,
  });

  return stream;
}

/**
 * Generate a meeting summary from conversation history (non-streaming).
 */
export async function generateMeetingSummary(input: {
  userId: string;
  conversationHistory: ConversationMessage[];
}) {
  const conversationText = JSON.stringify(input.conversationHistory, null, 2);

  const messages: AIMessage[] = [
    {
      role: "system",
      content: `You are an expert summarizer. You write readable, concise, simple content. You are given a transcript of a meeting and you need to summarize it.

Use the following markdown structure for every output:

### Overview
Provide a detailed, engaging summary of the session's content. Focus on major features, user workflows, and any key takeaways. Write in a narrative style, using full sentences. Highlight unique or powerful aspects of the product, platform, or discussion.

### Notes
Break down key content into thematic sections with timestamp ranges. Each section should summarize key points, actions, or demos in bullet format.

Example:
#### Section Name
- Main point or demo shown here
- Another key insight or interaction
- Follow-up tool or explanation provided

#### Next Section
- Feature X automatically does Y
- Mention of integration with Z`,
    },
    {
      role: "user",
      content: `Here is the conversation history:\n\n${conversationText}`,
    },
  ];

  const response = await callLLM(input.userId, { messages });
  return response.content || "No summary available.";
}

/**
 * Extract action items from a conversation transcript.
 */
export async function extractActionItems(input: {
  userId: string;
  conversationHistory: ConversationMessage[];
}) {
  const conversationText = JSON.stringify(input.conversationHistory, null, 2);

  const messages: AIMessage[] = [
    {
      role: "system",
      content: `You are an expert at extracting action items from meeting transcripts.
Given a conversation, identify all tasks, follow-ups, and commitments.

Return a JSON array of action items. Each item should have:
- "task": a concise description of what needs to be done
- "assignee": who should do it ("user" or "assistant" or "unassigned")
- "priority": "high", "medium", or "low"

If there are no action items, return an empty array: []

Return ONLY the JSON array, no other text or formatting.`,
    },
    {
      role: "user",
      content: `Extract action items from this conversation:\n\n${conversationText}`,
    },
  ];

  try {
    const response = await callLLM(input.userId, { messages });
    const content = response.content || "[]";
    // Clean any markdown wrapping
    const cleaned = content
      .replace(/```json?\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    // Validate it's valid JSON
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    return "[]";
  }
}

/**
 * Post-meeting chat response (non-streaming).
 */
export async function getMeetingChatResponse(input: {
  userId: string;
  agentName: string;
  userName: string;
  instructions: string;
  summary: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
}) {
  const systemPrompt = `You are an AI assistant and your name is ${input.agentName}.
You had a meeting with user whose name is ${input.userName}.
You are helping the user revisit a recently completed meeting.
Below is a summary of the meeting, generated from the transcript:${input.summary}

The following are your original instructions from the live meeting assistant. Please continue to follow these behavioral guidelines as you assist the user:
${input.instructions}

The user may ask questions about the meeting, request clarifications, or ask for follow-up actions.
Always base your responses on the meeting summary above.

You also have access to the recent conversation history between you and the user. Use the context of previous messages to provide relevant, coherent, and helpful responses. If the user's question refers to something discussed earlier, make sure to take that into account and maintain continuity in the conversation.

If the summary does not contain enough information to answer a question, politely let the user know.

Be concise, helpful, and focus on providing accurate information from the meeting and the ongoing conversation.`;

  const sanitizedMessages = input.messages.map(({ role, content }) => ({
    role,
    content,
  }));

  const messages: AIMessage[] = [
    { role: "system", content: systemPrompt },
    ...sanitizedMessages,
  ];

  const response = await callLLM(input.userId, { messages });
  return response.content || "";
}
