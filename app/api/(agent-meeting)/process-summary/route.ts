import { db } from "@/db";
import { meetings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function POST(req: Request) {
  const { meetingId, conversationHistory } = await req.json();

  const [meeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, meetingId));

  await db
    .update(meetings)
    .set({
      status: "processing",
      conversationHistory: JSON.stringify(conversationHistory),
      endedAt: new Date(),
    })
    .where(eq(meetings.id, meetingId));

  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const conversationText = JSON.stringify(conversationHistory, null, 2);

  const completion = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [
      {
        role: "system",
        content: `
You are an expert summarizer. You write readable, concise, simple content. You are given a transcript of a meeting and you need to summarize it.

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
- Mention of integration with Z
`.trim(),
      },
      {
        role: "user",
        content: `Here is the conversation history:\n\n${conversationText}`,
      },
    ],
  });

  const summaryText =
    completion.choices?.[0]?.message?.content ?? "No summary available.";

  await new Promise((resolve) => setTimeout(resolve, 30000));

  await db
    .update(meetings)
    .set({
      summary: summaryText,
      status: "completed",
    })
    .where(eq(meetings.id, meetingId));

  return NextResponse.json({ success: true });
}
