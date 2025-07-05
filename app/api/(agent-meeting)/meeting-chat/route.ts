import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, summary, instructions, agentName, userName } = body;

  const systemPrompt = `
    You are an AI assistant and you name is ${agentName}.
    You had a meeting with user whose name is ${userName}.
    You are helping the user revisit a recently completed meeting.
    Below is a summary of the meeting, generated from the transcript:${summary}

    The following are your original instructions from the live meeting assistant. Please continue to follow these behavioral guidelines as you assist the user:
    ${instructions}

    The user may ask questions about the meeting, request clarifications, or ask for follow-up actions.
    Always base your responses on the meeting summary above.

    You also have access to the recent conversation history between you and the user. Use the context of previous messages to provide relevant, coherent, and helpful responses. If the user's question refers to something discussed earlier, make sure to take that into account and maintain continuity in the conversation.

    If the summary does not contain enough information to answer a question, politely let the user know.

    Be concise, helpful, and focus on providing accurate information from the meeting and the ongoing conversation.
  `.trim();

  const groqResponse = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [{ role: "system", content: systemPrompt }, ...messages],
  });

  const reply = groqResponse.choices?.[0]?.message;

  return NextResponse.json({ reply });
}
