import { db } from "@/db";
import { meetings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { meetingId } = await req.json();

  const [meeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, meetingId));

  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  if (!meeting.startedAt) {
    await db
      .update(meetings)
      .set({
        status: "active",
        startedAt: new Date(),
      })
      .where(eq(meetings.id, meetingId));

    return NextResponse.json({ success: true, message: "Meeting started" });
  }

  if (meeting.haultedAt && !meeting.restartedAt) {
    await db
      .update(meetings)
      .set({
        status: "active",
        restartedAt: new Date(),
      })
      .where(eq(meetings.id, meetingId));

    return NextResponse.json({ success: true, message: "Meeting resumed" });
  }

  return NextResponse.json({
    success: false,
    message: "Meeting already active or resumed",
  });
}
