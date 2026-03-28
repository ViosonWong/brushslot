"use client";

import dayjs from "dayjs";
import { PageShell } from "@/components/layout/PageShell";
import { getErrorMessage } from "@/lib/errors";
import { useArtistScheduleQuery } from "@/store/api";
import { useAppSelector } from "@/store/hooks";

export default function ArtistSchedulePage() {
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, error } = useArtistScheduleQuery(
    {
      from: dayjs().format("YYYY-MM-DD"),
      to: dayjs().add(14, "day").format("YYYY-MM-DD"),
    },
    { skip: !user || user.role !== "ARTIST" }
  );

  const errMsg = getErrorMessage(error);

  return (
    <PageShell title="我的排班" subtitle="查看自己的时段和已经预约的客户。">
      {!user ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
          请先登录。
        </div>
      ) : user.role !== "ARTIST" ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
          当前账号不是画师。
        </div>
      ) : isLoading ? (
        <div className="text-sm text-zinc-600">加载中...</div>
      ) : errMsg ? (
        <div className="text-sm text-rose-600">{String(errMsg)}</div>
      ) : (
        <div className="grid gap-4">
          {(data ?? []).map((slot) => (
            <article
              key={slot.id}
              className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-base font-semibold text-zinc-900">
                    {dayjs(slot.startAt).format("YYYY-MM-DD HH:mm")} -{" "}
                    {dayjs(slot.endAt).format("HH:mm")}
                  </div>
                  <div className="mt-1 text-sm text-zinc-500">时段状态：{slot.status}</div>
                </div>
                {slot.booking ? (
                  <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">
                    已被预约
                  </span>
                ) : null}
              </div>

              {slot.booking ? (
                <div className="mt-4 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
                  <div>预约人：{slot.booking.contactName}</div>
                  <div className="mt-1">状态：{slot.booking.status}</div>
                  {slot.booking.requestNote ? (
                    <div className="mt-2 leading-6">备注：{slot.booking.requestNote}</div>
                  ) : null}
                </div>
              ) : slot.note ? (
                <div className="mt-4 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
                  备注：{slot.note}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
