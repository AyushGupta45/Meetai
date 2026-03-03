"use client";

import { useMemo } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GeneratedAvatar } from "@/components/generated-avatar";
import {
  BotIcon,
  VideoIcon,
  CalendarIcon,
  KeyIcon,
  PlusIcon,
  ArrowRightIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  TrendingUpIcon,
  TimerIcon,
} from "lucide-react";
import Link from "next/link";
import { format, formatDistanceToNow, subDays } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  completed: "hsl(142, 71%, 45%)",
  upcoming: "hsl(217, 91%, 60%)",
  active: "hsl(0, 84%, 60%)",
  processing: "hsl(38, 92%, 50%)",
};

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

const HomeView = () => {
  const trpc = useTRPC();
  const { data: session } = authClient.useSession();
  const { data: stats } = useQuery(trpc.dashboard.getStats.queryOptions());

  const userName = session?.user?.name?.split(" ")[0] ?? "there";

  // Build 7-day chart data (fill missing dates with 0)
  const chartData = useMemo(() => {
    const days: { date: string; label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const key = format(d, "yyyy-MM-dd");
      const label = format(d, "EEE");
      const found = stats?.meetingsPerDay?.find((r) => r.date === key);
      days.push({ date: key, label, count: found ? found.count : 0 });
    }
    return days;
  }, [stats?.meetingsPerDay]);

  // Status breakdown for pie chart
  const statusData = useMemo(() => {
    if (!stats) return [];
    const completed = stats.completedCount ?? 0;
    const upcoming = stats.upcomingCount ?? 0;
    const other = Math.max(0, (stats.meetingCount ?? 0) - completed - upcoming);
    return [
      { name: "Completed", value: completed, color: STATUS_COLORS.completed },
      { name: "Upcoming", value: upcoming, color: STATUS_COLORS.upcoming },
      { name: "Other", value: other, color: STATUS_COLORS.processing },
    ].filter((d) => d.value > 0);
  }, [stats]);

  return (
    <div className="flex flex-col gap-y-6 p-4 md:px-8 pb-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {userName} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here&apos;s an overview of your workspace.
        </p>
      </div>

      {/* Credentials banner */}
      {stats && stats.credentialCount === 0 && (
        <div className="flex items-center gap-x-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3">
          <AlertTriangleIcon className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              No API credentials configured
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
              Add a credential to start using AI agents in your meetings.
            </p>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href="/credentials">
              <KeyIcon className="size-3.5 mr-1.5" />
              Add Credential
            </Link>
          </Button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Agents
            </CardTitle>
            <div className="rounded-md bg-primary/10 p-1.5">
              <BotIcon className="size-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.agentCount ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              AI assistants created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Meetings
            </CardTitle>
            <div className="rounded-md bg-blue-500/10 p-1.5">
              <VideoIcon className="size-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.meetingCount ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500 font-medium">
                {stats?.completedCount ?? 0}
              </span>{" "}
              completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Week
            </CardTitle>
            <div className="rounded-md bg-orange-500/10 p-1.5">
              <TrendingUpIcon className="size-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.meetingsThisWeek ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              meetings this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Duration
            </CardTitle>
            <div className="rounded-md bg-purple-500/10 p-1.5">
              <TimerIcon className="size-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatDuration(stats?.avgDurationSeconds ?? null)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">per meeting</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Activity chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Meeting Activity</CardTitle>
            <CardDescription>
              Meetings created in the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={32}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      backgroundColor: "hsl(var(--popover))",
                      color: "hsl(var(--popover-foreground))",
                      fontSize: "12px",
                    }}
                    labelFormatter={(v, payload) => {
                      const item = payload?.[0]?.payload;
                      return item?.date ?? v;
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Meetings"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Status Breakdown</CardTitle>
            <CardDescription>Meeting distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                No meetings yet
              </p>
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {statusData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "12px" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        backgroundColor: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent meetings */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Meetings</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/meetings">
                View all
                <ArrowRightIcon className="size-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!stats?.recentMeetings?.length ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No meetings yet. Create your first meeting to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentMeetings.map((meeting) => (
                  <Link
                    key={meeting.id}
                    href={`/meetings/${meeting.id}`}
                    className="flex items-center gap-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <GeneratedAvatar
                      seed={meeting.agent.name}
                      variant="botttsNeutral"
                      className="size-8"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {meeting.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        with {meeting.agent.name} &middot;{" "}
                        {formatDistanceToNow(new Date(meeting.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={
                        meeting.status === "completed"
                          ? "default"
                          : meeting.status === "active"
                            ? "destructive"
                            : "secondary"
                      }
                      className="shrink-0 capitalize"
                    >
                      {meeting.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column: quick actions + top agents */}
        <div className="flex flex-col gap-6">
          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/agents">
                  <PlusIcon className="size-4 mr-2" />
                  Create Agent
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/meetings">
                  <VideoIcon className="size-4 mr-2" />
                  Start Meeting
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/credentials">
                  <KeyIcon className="size-4 mr-2" />
                  Manage Credentials
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Top agents */}
          {stats?.meetingsPerAgent && stats.meetingsPerAgent.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Agents</CardTitle>
                <CardDescription>Most used agents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.meetingsPerAgent.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-x-3">
                      <GeneratedAvatar
                        seed={item.agentName}
                        variant="botttsNeutral"
                        className="size-7"
                      />
                      <span className="text-sm font-medium flex-1 truncate">
                        {item.agentName}
                      </span>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeView;
