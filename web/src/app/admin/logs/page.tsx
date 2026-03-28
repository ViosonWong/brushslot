"use client";

import dayjs from "dayjs";
import { PageShell } from "@/components/layout/PageShell";
import { getErrorMessage } from "@/lib/errors";
import { useAdminLogsQuery } from "@/store/api";
import { useAppSelector } from "@/store/hooks";

export default function AdminLogsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, error } = useAdminLogsQuery({}, { skip: user?.role !== "ADMIN" });
  const errMsg = getErrorMessage(error);

  if (!user || user.role !== "ADMIN") {
    return (
      <PageShell title="操作日志" subtitle="仅管理员可访问。">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
          需要管理员账号。
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="操作日志" subtitle="查看管理员操作留痕。">
      {isLoading ? <div className="text-sm text-zinc-600">加载中...</div> : null}
      {errMsg ? <div className="text-sm text-rose-600">{String(errMsg)}</div> : null}
      <div className="grid gap-4">
        {(data ?? []).map((log) => (
          <article
            key={log.id}
            className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-zinc-900">{log.action}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  {log.targetType} / {log.targetId}
                </div>
              </div>
              <div className="text-xs text-zinc-500">
                {dayjs(log.createdAt).format("YYYY-MM-DD HH:mm")}
              </div>
            </div>
            <div className="mt-3 text-sm text-zinc-600">
              操作人：{log.adminUser.name} / {log.adminUser.phone}
            </div>
            {log.payload ? (
              <pre className="mt-3 overflow-x-auto rounded-2xl bg-zinc-50 p-3 text-xs text-zinc-600">
                {JSON.stringify(log.payload, null, 2)}
              </pre>
            ) : null}
          </article>
        ))}
      </div>
    </PageShell>
  );
}
