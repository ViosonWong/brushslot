"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { PageShell } from "@/components/layout/PageShell";
import { getErrorMessage } from "@/lib/errors";
import {
  useArtistQuery,
  useArtistSlotsQuery,
  useCreateBookingMutation,
} from "@/store/api";
import { useAppSelector } from "@/store/hooks";

function ymd(date: Date) {
  return dayjs(date).format("YYYY-MM-DD");
}

export default function ArtistDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const artistId = params.id;
  const [from, setFrom] = useState(ymd(new Date()));
  const [to, setTo] = useState(ymd(dayjs().add(14, "day").toDate()));
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const user = useAppSelector((s) => s.auth.user);

  const artistQuery = useArtistQuery(artistId);
  const slotsQuery = useArtistSlotsQuery({ artistId, from, to });
  const [createBooking, { isLoading, error }] = useCreateBookingMutation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) return;
    await createBooking({
      slotId: selectedSlotId,
      contactName: contactName || user?.name || "",
      contactPhone,
      requestNote,
    }).unwrap();
    setRequestNote("");
    setContactPhone("");
    setSelectedSlotId("");
    slotsQuery.refetch();
  };

  const errMsg = getErrorMessage(error);

  return (
    <PageShell
      title={artistQuery.data?.displayName ?? "画师详情"}
      subtitle="选择可预约时段并提交预约。移动端与桌面端都可以直接操作。"
    >
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-zinc-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium text-zinc-900">
                {artistQuery.data?.displayName ?? "-"}
              </div>
              <div className="text-sm text-zinc-500">
                时长 {artistQuery.data?.slotDurationMin ?? "--"} 分钟
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {artistQuery.data?.bio ? (
            <p className="mt-4 text-sm leading-6 text-zinc-600">{artistQuery.data.bio}</p>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(slotsQuery.data ?? []).map((slot) => {
              const active = selectedSlotId === slot.id;
              return (
                <label
                  key={slot.id}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    active
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-zinc-50 text-zinc-900 hover:border-zinc-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="slotId"
                    value={slot.id}
                    checked={active}
                    onChange={() => setSelectedSlotId(slot.id)}
                    className="sr-only"
                  />
                  <div className="text-sm font-medium">
                    {dayjs(slot.startAt).format("MM-DD HH:mm")} -{" "}
                    {dayjs(slot.endAt).format("HH:mm")}
                  </div>
                  <div className={`mt-1 text-xs ${active ? "text-white/70" : "text-zinc-500"}`}>
                    {dayjs(slot.startAt).format("dddd")}
                  </div>
                </label>
              );
            })}
          </div>

          {slotsQuery.data && slotsQuery.data.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600">
              这个时间范围内还没有可预约时段。
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">提交预约</h2>
          {!user ? (
            <p className="mt-3 text-sm text-zinc-600">请先登录后再预约。</p>
          ) : user.role !== "CUSTOMER" ? (
            <p className="mt-3 text-sm text-zinc-600">只有普通用户可以提交预约。</p>
          ) : (
            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-900">联系人</label>
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder={user.name}
                  className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-900">联系电话</label>
                <input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="可选"
                  className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-900">需求备注</label>
                <textarea
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
                  placeholder="例如：头像稿、半身、偏暖色、用途说明..."
                />
              </div>
              {errMsg ? <p className="text-sm text-rose-600">{String(errMsg)}</p> : null}
              <button
                disabled={!selectedSlotId || isLoading}
                className="w-full rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {isLoading ? "提交中..." : "确认预约"}
              </button>
            </form>
          )}
        </section>
      </div>
    </PageShell>
  );
}
