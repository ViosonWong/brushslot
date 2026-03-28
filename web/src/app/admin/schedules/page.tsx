"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { PageShell } from "@/components/layout/PageShell";
import type { WeeklyScheduleTemplate } from "@/lib/types";
import {
  useAdminArtistsQuery,
  useAdminGenerateSlotsMutation,
  useAdminGetTemplatesQuery,
  useAdminPatchSlotMutation,
  useAdminSlotsQuery,
  useAdminUpsertTemplatesMutation,
} from "@/store/api";
import { useAppSelector } from "@/store/hooks";

const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const defaultTemplates = [1, 2, 3, 4, 5].map((weekday) => ({
  weekday,
  startTime: "10:00",
  endTime: "18:00",
  isEnabled: true,
}));

export default function AdminSchedulesPage() {
  const user = useAppSelector((s) => s.auth.user);
  const { data: artists } = useAdminArtistsQuery(undefined, { skip: user?.role !== "ADMIN" });
  const [artistId, setArtistId] = useState<string | null>(null);
  const [from, setFrom] = useState(dayjs().format("YYYY-MM-DD"));
  const [to, setTo] = useState(dayjs().add(14, "day").format("YYYY-MM-DD"));
  const [templateDrafts, setTemplateDrafts] = useState<Record<string, WeeklyScheduleTemplate[]>>({});
  const [upsertTemplates, upsertState] = useAdminUpsertTemplatesMutation();
  const [generateSlots, generateState] = useAdminGenerateSlotsMutation();
  const [patchSlot] = useAdminPatchSlotMutation();
  const selectedArtistId = artistId ?? artists?.[0]?.id ?? "";

  const { data: remoteTemplates } = useAdminGetTemplatesQuery(
    { artistId: selectedArtistId },
    { skip: !selectedArtistId || user?.role !== "ADMIN" }
  );
  const { data: slots } = useAdminSlotsQuery(
    { artistId: selectedArtistId, from, to },
    { skip: !selectedArtistId || user?.role !== "ADMIN" }
  );

  const templates =
    templateDrafts[selectedArtistId] ??
    (remoteTemplates && remoteTemplates.length > 0 ? remoteTemplates : defaultTemplates);

  const updateTemplates = (nextTemplates: WeeklyScheduleTemplate[]) => {
    if (!selectedArtistId) return;
    setTemplateDrafts((prev) => ({ ...prev, [selectedArtistId]: nextTemplates }));
  };

  if (!user || user.role !== "ADMIN") {
    return (
      <PageShell title="排班管理" subtitle="仅管理员可访问。">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
          需要管理员账号。
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="排班管理" subtitle="设置固定班表、批量生成时段，并手动封班。">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3">
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
          </div>

          <div className="mt-5">
            <h2 className="text-base font-semibold text-zinc-900">固定班表</h2>
            <div className="mt-3 grid gap-3">
              {templates.map((tpl, idx) => (
                <div
                  key={`${tpl.weekday}-${idx}`}
                  className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 rounded-2xl border border-zinc-200 p-3"
                >
                  <select
                    value={tpl.weekday}
                    onChange={(e) =>
                      updateTemplates(
                        templates.map((item, i) =>
                          i === idx ? { ...item, weekday: Number(e.target.value) } : item
                        )
                      )
                    }
                    className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                  >
                    {weekdays.map((label, weekday) => (
                      <option key={label} value={weekday}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={tpl.startTime}
                    onChange={(e) =>
                      updateTemplates(
                        templates.map((item, i) =>
                          i === idx ? { ...item, startTime: e.target.value } : item
                        )
                      )
                    }
                    className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                  />
                  <input
                    type="time"
                    value={tpl.endTime}
                    onChange={(e) =>
                      updateTemplates(
                        templates.map((item, i) =>
                          i === idx ? { ...item, endTime: e.target.value } : item
                        )
                      )
                    }
                    className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => updateTemplates(templates.filter((_, i) => i !== idx))}
                    className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
                  >
                    删除
                  </button>
                </div>
              ))}
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={() =>
                    updateTemplates([
                      ...templates,
                      { weekday: 1, startTime: "10:00", endTime: "18:00", isEnabled: true },
                    ])
                  }
                  className="rounded-2xl border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  增加一行
                </button>
                <button
                  disabled={!selectedArtistId || upsertState.isLoading}
                  onClick={() => upsertTemplates({ artistId: selectedArtistId, templates })}
                  className="rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {upsertState.isLoading ? "保存中..." : "保存班表"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-base font-semibold text-zinc-900">批量生成时段</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
            <button
              disabled={!selectedArtistId || generateState.isLoading}
              onClick={() => generateSlots({ artistId: selectedArtistId, from, to })}
              className="mt-3 w-full rounded-2xl border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              {generateState.isLoading ? "生成中..." : "生成时段"}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">时段列表</h2>
          <div className="mt-4 grid gap-3">
            {(slots ?? []).map((slot) => (
              <div
                key={slot.id}
                className="rounded-2xl border border-zinc-200 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-medium text-zinc-900">
                      {dayjs(slot.startAt).format("YYYY-MM-DD HH:mm")} -{" "}
                      {dayjs(slot.endAt).format("HH:mm")}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      状态：{slot.status}
                      {slot.booking ? ` / 已预约：${slot.booking.contactName}` : ""}
                    </div>
                  </div>
                  {!slot.booking ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          patchSlot({
                            slotId: slot.id,
                            status: "BLOCKED",
                            artistId: selectedArtistId,
                          })
                        }
                        className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
                      >
                        封班
                      </button>
                      <button
                        onClick={() =>
                          patchSlot({
                            slotId: slot.id,
                            status: "AVAILABLE",
                            artistId: selectedArtistId,
                          })
                        }
                        className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
                      >
                        恢复
                      </button>
                      <button
                        onClick={() =>
                          patchSlot({
                            slotId: slot.id,
                            status: "OFF",
                            artistId: selectedArtistId,
                          })
                        }
                        className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
                      >
                        休息
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {slots && slots.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600">
                当前时间范围内没有时段。
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
