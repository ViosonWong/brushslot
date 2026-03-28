"use client";

import dayjs from "dayjs";
import { PageShell } from "@/components/layout/PageShell";
import { getErrorMessage } from "@/lib/errors";
import { useCancelBookingMutation, useMyBookingsQuery } from "@/store/api";
import { useAppSelector } from "@/store/hooks";

export default function MyBookingsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, error } = useMyBookingsQuery(undefined, {
    skip: !user || user.role !== "CUSTOMER",
  });
  const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation();

  const errMsg = getErrorMessage(error);

  return (
    <PageShell title="我的预约" subtitle="查看预约记录，并在未开始前取消预约。">
      {!user ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
          请先登录。
        </div>
      ) : user.role !== "CUSTOMER" ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
          当前账号不是普通用户。
        </div>
      ) : isLoading ? (
        <div className="text-sm text-zinc-600">加载中...</div>
      ) : errMsg ? (
        <div className="text-sm text-rose-600">{String(errMsg)}</div>
      ) : (
        <div className="grid gap-4">
          {(data ?? []).map((booking) => (
            <article
              key={booking.id}
              className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-base font-semibold text-zinc-900">
                    {booking.artist.displayName}
                  </div>
                  <div className="mt-1 text-sm text-zinc-600">
                    {dayjs(booking.slot.startAt).format("YYYY-MM-DD HH:mm")} -{" "}
                    {dayjs(booking.slot.endAt).format("HH:mm")}
                  </div>
                  <div className="mt-2 text-sm text-zinc-500">
                    预约状态：{booking.status}
                  </div>
                </div>
                {booking.status === "PENDING" || booking.status === "CONFIRMED" ? (
                  <button
                    disabled={isCancelling}
                    onClick={() => cancelBooking({ bookingId: booking.id })}
                    className="rounded-full border border-rose-200 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                  >
                    取消预约
                  </button>
                ) : null}
              </div>

              {booking.requestNote ? (
                <p className="mt-3 text-sm leading-6 text-zinc-600">{booking.requestNote}</p>
              ) : null}

              {booking.adminNote ? (
                <div className="mt-3 rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-600">
                  管理备注：{booking.adminNote}
                </div>
              ) : null}
            </article>
          ))}

          {data && data.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600">
              还没有预约记录。
            </div>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}
