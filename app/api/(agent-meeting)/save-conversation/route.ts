import { db } from "@/db";
import { meetings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { meetingId, conversationHistory } = await req.json();
  console.log(conversationHistory);
  console.log(typeof conversationHistory);

  const [meeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, meetingId));

  await db
    .update(meetings)
    .set({
      conversationHistory: JSON.stringify(conversationHistory),
    })
    .where(eq(meetings.id, meetingId));

  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: conversationHistory });
}
