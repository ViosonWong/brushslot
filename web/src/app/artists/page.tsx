"use client";

import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { getErrorMessage } from "@/lib/errors";
import { useArtistsQuery } from "@/store/api";

export default function ArtistsPage() {
  const { data, isLoading, error } = useArtistsQuery();

  const errMsg = getErrorMessage(error);

  return (
    <PageShell title="画师" subtitle="选择一位画师，查看可预约时段。">
      {isLoading ? (
        <div className="text-sm text-zinc-600">加载中...</div>
      ) : errMsg ? (
        <div className="text-sm text-rose-600">{String(errMsg)}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((a) => (
          <Link
            key={a.id}
            href={`/artists/${a.id}`}
            className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-zinc-900">
                  {a.displayName}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  时长 {a.slotDurationMin} 分钟 / 可提前 {a.advanceDays} 天预约
                </div>
              </div>
              <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white">
                可预约
              </span>
            </div>
            {a.bio ? (
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600">
                {a.bio}
              </p>
            ) : (
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                暂无介绍
              </p>
            )}
          </Link>
        ))}
      </div>

      {data && data.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600">
          目前还没有画师。请用管理员账号进入「画师管理」创建画师。
        </div>
      ) : null}
    </PageShell>
  );
}
