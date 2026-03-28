import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";

export default function Home() {
  return (
    <PageShell
      title="Brushslot"
      subtitle="一个面向画师预约与排班的全栈练手项目，移动端(H5)与 PC 都能顺畅使用。"
    >
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">
            快速开始
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            先去浏览画师，选择一个可预约时段并下单。管理员可以维护画师排班并生成可预约时段。
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/artists"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              浏览画师
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              登录
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">角色</h2>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-zinc-200 p-4">
              <div className="text-sm font-medium text-zinc-900">用户</div>
              <div className="mt-1 text-sm text-zinc-600">选择画师时段并预约，查看与取消预约。</div>
            </div>
            <div className="rounded-2xl border border-zinc-200 p-4">
              <div className="text-sm font-medium text-zinc-900">画师</div>
              <div className="mt-1 text-sm text-zinc-600">查看自己的排班与预约信息。</div>
            </div>
            <div className="rounded-2xl border border-zinc-200 p-4">
              <div className="text-sm font-medium text-zinc-900">管理员</div>
              <div className="mt-1 text-sm text-zinc-600">维护排班模板、生成/封班时段、登记出勤、管理预约。</div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
