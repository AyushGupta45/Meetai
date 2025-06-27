// app/api/join-meeting/route.ts
import { db } from "@/db";
import { meetings } from "@/db/schema";
import { eq, and, not } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { meetingId } = await req.json();

  const [meeting] = await db
    .select()
    .from(meetings)
    .where(
      and(
        eq(meetings.id, meetingId),
        not(eq(meetings.status, "completed")),
        not(eq(meetings.status, "active")),
        not(eq(meetings.status, "cancelled")),
        not(eq(meetings.status, "processing"))
      )
    );

  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  await db
    .update(meetings)
    .set({ status: "active", startedAt: new Date() })
    .where(eq(meetings.id, meeting.id));

  return NextResponse.json({ success: true });
}
