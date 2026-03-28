"use client";

import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { getErrorMessage } from "@/lib/errors";
import {
  useAdminArtistsQuery,
  useAdminCreateArtistMutation,
  useAdminUpdateArtistMutation,
} from "@/store/api";
import { useAppSelector } from "@/store/hooks";

const initialForm = {
  phone: "",
  password: "",
  name: "",
  displayName: "",
  bio: "",
  slotDurationMin: 60,
  advanceDays: 30,
};

export default function AdminArtistsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, error } = useAdminArtistsQuery(undefined, {
    skip: user?.role !== "ADMIN",
  });
  const [createArtist, createState] = useAdminCreateArtistMutation();
  const [updateArtist] = useAdminUpdateArtistMutation();
  const [form, setForm] = useState(initialForm);

  const errMsg = getErrorMessage(error);

  if (!user) {
    return (
      <PageShell title="画师管理" subtitle="请先登录管理员账号。">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
          请先登录。
        </div>
      </PageShell>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <PageShell title="画师管理" subtitle="仅管理员可访问。">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
          当前账号不是管理员。
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="画师管理" subtitle="创建画师账号并调整基础信息。">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.4fr]">
        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">新建画师</h2>
          <form
            className="mt-4 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              await createArtist({
                ...form,
                slotDurationMin: Number(form.slotDurationMin),
                advanceDays: Number(form.advanceDays),
              }).unwrap();
              setForm(initialForm);
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="账号名称"
                className="rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              />
              <input
                value={form.displayName}
                onChange={(e) => setForm((s) => ({ ...s, displayName: e.target.value }))}
                placeholder="画师展示名"
                className="rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={form.phone}
                onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                placeholder="手机号"
                className="rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                placeholder="初始密码"
                className="rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              />
            </div>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value }))}
              rows={4}
              placeholder="画师介绍"
              className="w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="number"
                value={form.slotDurationMin}
                onChange={(e) =>
                  setForm((s) => ({ ...s, slotDurationMin: Number(e.target.value) }))
                }
                placeholder="单个时段分钟数"
                className="rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={form.advanceDays}
                onChange={(e) =>
                  setForm((s) => ({ ...s, advanceDays: Number(e.target.value) }))
                }
                placeholder="提前开放天数"
                className="rounded-2xl border border-zinc-200 px-3 py-2 text-sm"
              />
            </div>
            <button
              disabled={createState.isLoading}
              className="w-full rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {createState.isLoading ? "创建中..." : "创建画师"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">已创建画师</h2>
          {isLoading ? <div className="mt-3 text-sm text-zinc-600">加载中...</div> : null}
          {errMsg ? <div className="mt-3 text-sm text-rose-600">{String(errMsg)}</div> : null}
          <div className="mt-4 grid gap-4">
            {(data ?? []).map((artist) => (
              <article key={artist.id} className="rounded-2xl border border-zinc-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-base font-semibold text-zinc-900">
                      {artist.displayName}
                    </div>
                    <div className="mt-1 text-sm text-zinc-500">
                      {artist.user.phone} / {artist.user.name}
                    </div>
                    {artist.bio ? (
                      <p className="mt-2 text-sm leading-6 text-zinc-600">{artist.bio}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        updateArtist({
                          artistId: artist.id,
                          body: { isActive: !artist.isActive },
                        })
                      }
                      className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      {artist.isActive ? "停用" : "启用"}
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-zinc-600 sm:grid-cols-3">
                  <div>时长：{artist.slotDurationMin} 分钟</div>
                  <div>提前开放：{artist.advanceDays} 天</div>
                  <div>状态：{artist.isActive ? "启用" : "停用"}</div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
