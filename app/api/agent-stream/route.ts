import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  const { agentInstructions, conversationHistory } = await req.json();

  const stream = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      { role: "system", content: agentInstructions },
      ...(conversationHistory || []),
    ],
    stream: true,
    max_tokens: 200,
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
