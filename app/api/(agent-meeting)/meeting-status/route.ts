import { db } from "@/db";
import { meetings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { meetingId, status: newStatus } = await req.json();

  if (!["active", "cancelled"].includes(newStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const [meeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, meetingId));

  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const updateData: any = { status: newStatus };

  if (newStatus === "active") {
    updateData.startedAt = new Date();
  }

  await db.update(meetings).set(updateData).where(eq(meetings.id, meetingId));

  return NextResponse.json({ success: true });
}
