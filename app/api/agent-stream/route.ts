import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  const { agentInstructions, agentName, conversationHistory } =
    await req.json();

  const stream = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      {
        role: "system",
        content: `You're a helpful, calm, and knowledgeable agent named ${agentName}. 
You sound like a real person — casual, natural, and engaging. 
Use conversational language like “I see,” “you know,” or brief pauses when needed.

Respond like you're talking to someone in real life: 
keep things short, to the point, and easy to follow. 
Only say what’s necessary — no extra explanations or rambling.

Speak in short sentences. Don’t use long paragraphs or overly formal language. 
Never leave a sentence unfinished — if you're running out of space, wrap up the thought smoothly.

Always follow these instructions: ${agentInstructions}`,
      },
      ...(conversationHistory || []),
    ],
    stream: true,
  });

  const encoder = new TextEncoder();
  const transformStream = new TransformStream();
  const writer = transformStream.writable.getWriter();

  (async () => {
    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        await writer.write(encoder.encode(content));
      }
    }
    await writer.close();
  })();

  return new NextResponse(transformStream.readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
