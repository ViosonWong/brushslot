"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { PageShell } from "@/components/layout/PageShell";
import { useAdminArtistsQuery, useAdminSetAttendanceMutation } from "@/store/api";
import { useAppSelector } from "@/store/hooks";

export default function AdminAttendancePage() {
  const user = useAppSelector((s) => s.auth.user);
  const { data: artists } = useAdminArtistsQuery(undefined, {
    skip: user?.role !== "ADMIN",
  });
  const [artistId, setArtistId] = useState<string | null>(null);
  const [workDate, setWorkDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [status, setStatus] = useState<"NORMAL" | "LEAVE" | "ABSENT" | "PAUSED">("NORMAL");
  const [note, setNote] = useState("");
  const [setAttendance, state] = useAdminSetAttendanceMutation();
  const selectedArtistId = artistId ?? artists?.[0]?.id ?? "";

  if (!user || user.role !== "ADMIN") {
    return (
      <PageShell title="出勤管理" subtitle="仅管理员可访问。">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
          需要管理员账号。
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="出勤管理" subtitle="登记某位画师某天的出勤情况，并自动影响当天可预约时段。">
      <div className="mx-auto max-w-2xl rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={selectedArtistId}
            onChange={(e) => setArtistId(e.target.value)}
            className="rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="">选择画师</option>
            {(artists ?? []).map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.displayName}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={workDate}
            onChange={(e) => setWorkDate(e.target.value)}
            className="rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
          />
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "NORMAL" | "LEAVE" | "ABSENT" | "PAUSED")
            }
            className="rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
          >
            <option value="NORMAL">正常</option>
            <option value="LEAVE">请假</option>
            <option value="ABSENT">缺勤</option>
            <option value="PAUSED">停班</option>
          </select>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="备注"
            className="rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <button
          disabled={!selectedArtistId || state.isLoading}
          onClick={() =>
            setAttendance({ artistId: selectedArtistId, workDate, status, note })
          }
          className="mt-4 w-full rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {state.isLoading ? "提交中..." : "提交出勤"}
        </button>
      </div>
    </PageShell>
  );
}
