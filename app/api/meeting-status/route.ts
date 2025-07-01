import { db } from "@/db";
import { meetings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { meetingId, status: newStatus } = await req.json();

  const [meeting] = await db
    .select()
    .from(meetings)
    .where(eq(meetings.id, meetingId));

  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  const currentStatus = meeting.status;

  const allowedTransitions: Record<string, string[]> = {
    upcoming: ["active", "cancelled"],
    active: ["processing"], // ✅ now allows transition to "processing"
    processing: ["active", "completed"], // optional: allow resume or complete
    completed: [],
    cancelled: [],
  };

  const allowedNextStatuses = allowedTransitions[currentStatus] || [];

  if (!allowedNextStatuses.includes(newStatus)) {
    return NextResponse.json(
      {
        error: `Invalid transition from '${currentStatus}' to '${newStatus}'`,
      },
      { status: 400 }
    );
  }

  const updateData: any = { status: newStatus };

  if (newStatus === "active") {
    updateData.startedAt = new Date();
  }

  if (["completed", "processing"].includes(newStatus)) {
    updateData.endedAt = new Date();
  }

  await db.update(meetings).set(updateData).where(eq(meetings.id, meetingId));

  return NextResponse.json({ success: true });
}
