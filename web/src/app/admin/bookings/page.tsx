"use client";

import dayjs from "dayjs";
import { PageShell } from "@/components/layout/PageShell";
import { getErrorMessage } from "@/lib/errors";
import {
  useAdminBookingsQuery,
  useAdminUpdateBookingStatusMutation,
} from "@/store/api";
import { useAppSelector } from "@/store/hooks";

export default function AdminBookingsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, error } = useAdminBookingsQuery(
    {},
    { skip: user?.role !== "ADMIN" }
  );
  const [updateStatus, state] = useAdminUpdateBookingStatusMutation();

  const errMsg = getErrorMessage(error);

  if (!user || user.role !== "ADMIN") {
    return (
      <PageShell title="预约管理" subtitle="仅管理员可访问。">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
          需要管理员账号。
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="预约管理" subtitle="查看全部预约，并手动更新状态。">
      {isLoading ? <div className="text-sm text-zinc-600">加载中...</div> : null}
      {errMsg ? <div className="text-sm text-rose-600">{String(errMsg)}</div> : null}
      <div className="grid gap-4">
        {(data ?? []).map((booking) => (
          <article
            key={booking.id}
            className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-base font-semibold text-zinc-900">
                  {booking.artist.displayName} / {booking.customer.name}
                </div>
                <div className="mt-1 text-sm text-zinc-600">
                  {dayjs(booking.slot.startAt).format("YYYY-MM-DD HH:mm")} -{" "}
                  {dayjs(booking.slot.endAt).format("HH:mm")}
                </div>
                <div className="mt-2 text-sm text-zinc-500">
                  状态：{booking.status} / 用户手机号：{booking.customer.phone}
                </div>
                {booking.requestNote ? (
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{booking.requestNote}</p>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                <button
                  disabled={state.isLoading}
                  onClick={() =>
                    updateStatus({ bookingId: booking.id, status: "CONFIRMED" })
                  }
                  className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
                >
                  确认
                </button>
                <button
                  disabled={state.isLoading}
                  onClick={() =>
                    updateStatus({ bookingId: booking.id, status: "COMPLETED" })
                  }
                  className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
                >
                  完成
                </button>
                <button
                  disabled={state.isLoading}
                  onClick={() => updateStatus({ bookingId: booking.id, status: "NO_SHOW" })}
                  className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
                >
                  爽约
                </button>
                <button
                  disabled={state.isLoading}
                  onClick={() =>
                    updateStatus({ bookingId: booking.id, status: "CANCELLED" })
                  }
                  className="rounded-full border border-rose-200 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50"
                >
                  取消
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
