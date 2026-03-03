import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { agents, meetings } from "../db/schema";
import { AGENT_TEMPLATES, DEFAULT_VOICE_ID } from "../module/agents/constants";
import { nanoid } from "nanoid";

// ─── Fake data generators ──────────────────────────────────────────────────
function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(randomBetween(8, 20), randomBetween(0, 59), 0, 0);
  return d;
}

function addMinutes(d: Date, mins: number): Date {
  return new Date(d.getTime() + mins * 60_000);
}

// ─── Conversation templates ────────────────────────────────────────────────
const MEETING_NAMES = [
  "Frontend Architecture Review",
  "Career Growth Check-In",
  "Weekly English Practice",
  "Mock Technical Interview",
  "Debate: AI Ethics",
  "Stress Management Session",
  "Algorithm Deep Dive",
  "Goal Setting Workshop",
  "Code Refactoring Discussion",
  "Public Speaking Practice",
  "React Performance Review",
  "Leadership Coaching",
  "Grammar & Vocabulary Boost",
  "System Design Interview",
  "Mindfulness & Focus",
  "Data Structures Walkthrough",
  "Negotiation Skills Practice",
  "Python Best Practices",
  "Presentation Feedback",
  "Conflict Resolution Talk",
];

const SUMMARIES = [
  `## Meeting Summary\n\nThis session focused on improving code quality and architecture patterns. Key topics included:\n\n- **Component structure**: Discussed breaking monolithic components into smaller, reusable pieces\n- **State management**: Evaluated trade-offs between local state and global stores\n- **Performance**: Identified three areas where memoization could reduce re-renders by ~40%\n\nThe discussion was productive and resulted in several concrete action items for the coming week.`,

  `## Meeting Summary\n\nA productive career coaching session covering short-term and long-term professional goals.\n\n- **Current assessment**: Reviewed strengths (technical depth, communication) and growth areas (delegation, strategic thinking)\n- **3-month plan**: Defined milestones for taking ownership of a cross-team project\n- **Networking**: Discussed strategies for building professional relationships within the organization\n\nOverall energy was positive and the participant showed strong self-awareness.`,

  `## Meeting Summary\n\nEnglish conversation practice session focusing on business communication.\n\n- **Email writing**: Practiced formal vs. informal tone with real-world examples\n- **Presentation skills**: Rehearsed a 5-minute pitch with feedback on pronunciation and pacing\n- **Vocabulary**: Introduced 12 new business idioms and practiced them in context\n\nThe student has shown consistent improvement over the past few weeks.`,

  `## Meeting Summary\n\nMock interview session simulating a senior software engineer position.\n\n- **Behavioral questions**: Practiced STAR method responses for leadership and conflict scenarios\n- **System design**: Worked through designing a real-time notification system\n- **Technical coding**: Solved two medium-difficulty problems with discussion of time complexity\n\nStrong performance overall — main improvement area is narrating thought process more clearly.`,

  `## Meeting Summary\n\nDebate session exploring the ethics of artificial intelligence in healthcare.\n\n- **Arguments for**: Improved diagnostic accuracy, reduced human error, democratized access to expertise\n- **Arguments against**: Data privacy concerns, algorithmic bias, loss of human touch in patient care\n- **Key insight**: Both sides agreed that regulation and transparency are essential regardless of stance\n\nThe participant demonstrated excellent critical thinking and logical argumentation.`,

  `## Meeting Summary\n\nTherapeutic session using CBT techniques to address workplace anxiety.\n\n- **Identified patterns**: Catastrophizing and mind-reading cognitive distortions\n- **Coping strategies**: Practiced 4-7-8 breathing technique and thought challenging worksheet\n- **Progress**: The participant reported improved sleep quality since implementing last session's relaxation exercises\n\nNext session will focus on assertiveness training for workplace communication.`,
];

const ACTION_ITEMS_SETS = [
  JSON.stringify([
    {
      text: "Refactor the UserProfile component into smaller sub-components",
      completed: false,
    },
    { text: "Set up React.memo for expensive list rendering", completed: true },
    { text: "Write unit tests for the authentication flow", completed: false },
    {
      text: "Schedule follow-up architecture review in 2 weeks",
      completed: false,
    },
  ]),
  JSON.stringify([
    {
      text: "Update resume with recent project accomplishments",
      completed: true,
    },
    { text: "Draft proposal for the cross-team initiative", completed: false },
    {
      text: "Schedule 3 informal coffee chats with senior engineers",
      completed: false,
    },
    { text: "Complete online leadership course Module 3", completed: false },
  ]),
  JSON.stringify([
    { text: "Practice 5 business idioms daily for one week", completed: false },
    {
      text: "Record a 3-minute self-introduction and review",
      completed: false,
    },
    {
      text: "Read one business article and summarize key points",
      completed: true,
    },
  ]),
  JSON.stringify([
    {
      text: "Practice 3 behavioral questions using STAR method",
      completed: false,
    },
    {
      text: "Review system design fundamentals (load balancing, caching)",
      completed: true,
    },
    { text: "Solve 5 medium LeetCode problems by Friday", completed: false },
    {
      text: "Prepare 'Tell me about yourself' response (2 minutes)",
      completed: false,
    },
  ]),
  JSON.stringify([
    { text: "Research 3 recent AI regulation proposals", completed: false },
    {
      text: "Practice rebuttal techniques for Saturday's debate club",
      completed: false,
    },
    {
      text: "Write a 500-word essay arguing the opposing viewpoint",
      completed: true,
    },
  ]),
  JSON.stringify([
    { text: "Complete daily thought challenging worksheet", completed: false },
    { text: "Practice 4-7-8 breathing 3 times per day", completed: true },
    {
      text: "Journal about workplace situations that trigger anxiety",
      completed: false,
    },
    {
      text: "Try one assertiveness exercise at next team meeting",
      completed: false,
    },
  ]),
];

function makeConversation(agentName: string, meetingName: string): string {
  const exchanges = [
    [
      {
        role: "user",
        content: `Hi, I'd like to discuss ${meetingName.toLowerCase()} today.`,
      },
      {
        role: "assistant",
        content: `Of course! I'm happy to help with ${meetingName.toLowerCase()}. Let's start by understanding where you currently stand. Could you give me a brief overview of your current situation?`,
      },
    ],
    [
      {
        role: "user",
        content:
          "Sure. I've been working on this for a few weeks now and I feel like I'm making progress but there are some areas I'm stuck on.",
      },
      {
        role: "assistant",
        content:
          "That's completely normal — progress often comes in waves. Let's identify those sticking points. What specifically feels challenging right now?",
      },
    ],
    [
      {
        role: "user",
        content:
          "I think the main issue is that I'm trying to do too many things at once. I need to prioritize better.",
      },
      {
        role: "assistant",
        content:
          "Prioritization is a crucial skill. Let me suggest we use a simple framework: categorize your tasks by impact and urgency. What are the top 3 things on your plate right now?",
      },
    ],
    [
      {
        role: "user",
        content:
          "Well, there's the immediate deliverable due this week, then a longer-term project I'm leading, and also some personal development goals I've been neglecting.",
      },
      {
        role: "assistant",
        content:
          "Great breakdown. For the immediate deliverable, let's make sure you have a clear plan to finish that first. For the longer-term project, we can set weekly milestones. And for personal development — even 15 minutes a day can make a significant difference. Want to map out a specific schedule?",
      },
    ],
    [
      {
        role: "user",
        content: "Yes, that would be really helpful. Let's do that.",
      },
      {
        role: "assistant",
        content:
          "Perfect. Let's start with your week. Walk me through your typical day and we'll find pockets of time for each priority.",
      },
    ],
    [
      {
        role: "user",
        content:
          "I usually start around 9, have meetings until 11, then focus time until lunch. Afternoon is more meetings and then I try to wrap up by 6.",
      },
      {
        role: "assistant",
        content:
          "You have a solid 2-hour focus block in the morning — that's your power zone. I'd recommend using that for your highest-impact work. Can you protect that time from interruptions?",
      },
    ],
    [
      {
        role: "user",
        content:
          "I can try. Sometimes things come up but I think I can block it on my calendar.",
      },
      {
        role: "assistant",
        content:
          "Blocking it is a great first step. Also consider setting a status message so colleagues know you're in deep work mode. Shall we define what 'done' looks like for each of your three priorities?",
      },
    ],
    [
      { role: "user", content: "Yes, let's define those outcomes." },
      {
        role: "assistant",
        content:
          "Excellent. This has been a really productive discussion. Let me summarize what we've covered and the next steps we've agreed on. You're making great progress — keep up the momentum!",
      },
    ],
  ];

  const selectedExchanges = exchanges.slice(0, randomBetween(4, 8));
  const flat = selectedExchanges.flat();
  return JSON.stringify(flat);
}

// ─── Main seed function ────────────────────────────────────────────────────
async function seed() {
  const db = drizzle(process.env.DATABASE_URL!);

  const userId = process.argv[2];
  const credentialId = process.argv[3];

  if (!userId || !credentialId) {
    console.error("Usage: npx tsx scripts/seed.ts <userId> <credentialId>");
    console.error(
      "  Pass the ID of an existing user and credential to create demo agents & meetings.",
    );
    process.exit(1);
  }

  // ── 1. Seed agents ──
  console.log("🌱 Seeding agents...");
  const createdAgentIds: { id: string; name: string }[] = [];

  for (const template of AGENT_TEMPLATES) {
    if (template.id === "custom") continue;

    const id = nanoid();
    await db.insert(agents).values({
      id,
      name: template.title,
      instructions: template.instructions,
      credentialId,
      voiceId: DEFAULT_VOICE_ID,
      template: template.id,
      userId,
    });

    createdAgentIds.push({ id, name: template.title });
    console.log(`  ✅ Agent: ${template.title}`);
  }

  // ── 2. Seed meetings ──
  console.log("\n🌱 Seeding meetings...");

  const statuses: Array<"completed" | "upcoming" | "upcoming" | "processing"> =
    [
      "completed",
      "completed",
      "completed",
      "completed",
      "completed",
      "completed",
      "completed",
      "completed",
      "completed",
      "completed",
      "completed",
      "completed",
      "upcoming",
      "upcoming",
      "upcoming",
      "upcoming",
      "upcoming",
      "processing",
    ];

  for (let i = 0; i < statuses.length; i++) {
    const status = statuses[i];
    const agent = pick(createdAgentIds);
    const name = pick(MEETING_NAMES);
    const meetingId = nanoid();

    if (status === "completed") {
      const day = randomBetween(0, 13);
      const startedAt = daysAgo(day);
      const duration = randomBetween(5, 45);
      const endedAt = addMinutes(startedAt, duration);
      const createdAt = new Date(
        startedAt.getTime() - randomBetween(60, 600) * 1000,
      );

      await db.insert(meetings).values({
        id: meetingId,
        name,
        userId,
        agentId: agent.id,
        status: "completed",
        startedAt,
        endedAt,
        conversationHistory: makeConversation(agent.name, name),
        summary: pick(SUMMARIES),
        actionItems: pick(ACTION_ITEMS_SETS),
        createdAt,
        updatedAt: endedAt,
      });

      console.log(`  ✅ Completed: "${name}" (${duration}m, ${day}d ago)`);
    } else if (status === "upcoming") {
      const futureDay = randomBetween(1, 14);
      const createdAt = daysAgo(randomBetween(0, 3));
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + futureDay);
      scheduledDate.setHours(randomBetween(9, 18), 0, 0, 0);

      await db.insert(meetings).values({
        id: meetingId,
        name,
        userId,
        agentId: agent.id,
        status: "upcoming",
        createdAt,
        updatedAt: createdAt,
      });

      console.log(`  📅 Upcoming: "${name}" (in ${futureDay}d)`);
    } else {
      // processing
      const startedAt = daysAgo(0);
      const createdAt = new Date(startedAt.getTime() - 300_000);

      await db.insert(meetings).values({
        id: meetingId,
        name,
        userId,
        agentId: agent.id,
        status: "processing",
        startedAt,
        conversationHistory: makeConversation(agent.name, name),
        createdAt,
        updatedAt: startedAt,
      });

      console.log(`  ⏳ Processing: "${name}"`);
    }
  }

  console.log(
    `\n🎉 Seed complete! Created ${createdAgentIds.length} agents and ${statuses.length} meetings.`,
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
