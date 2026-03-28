"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageShell } from "@/components/layout/PageShell";
import { getErrorMessage } from "@/lib/errors";
import { useRegisterMutation } from "@/store/api";
import { setSession } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";

const schema = z.object({
  name: z.string().min(1).max(50),
  phone: z.string().min(6).max(20),
  password: z.string().min(8).max(72),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [registerMutation, { isLoading, error }] = useRegisterMutation();

  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    const res = await registerMutation(values).unwrap();
    dispatch(setSession(res));
    router.push("/artists");
  };

  const errMsg = getErrorMessage(error);

  return (
    <PageShell title="注册" subtitle="注册后即可预约画师。">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-900">昵称</label>
              <input
                {...register("name")}
                autoComplete="nickname"
                className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                placeholder="怎么称呼你"
              />
              {formState.errors.name ? (
                <p className="mt-1 text-xs text-rose-600">{formState.errors.name.message}</p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900">手机号</label>
              <input
                {...register("phone")}
                inputMode="tel"
                autoComplete="tel"
                className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                placeholder="例如：13800000000"
              />
              {formState.errors.phone ? (
                <p className="mt-1 text-xs text-rose-600">{formState.errors.phone.message}</p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900">密码</label>
              <input
                {...register("password")}
                type="password"
                autoComplete="new-password"
                className="mt-1 w-full rounded-2xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                placeholder="至少 8 位"
              />
              {formState.errors.password ? (
                <p className="mt-1 text-xs text-rose-600">{formState.errors.password.message}</p>
              ) : null}
            </div>

            {errMsg ? <p className="text-sm text-rose-600">{String(errMsg)}</p> : null}

            <button
              disabled={isLoading}
              className="w-full rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {isLoading ? "注册中..." : "注册"}
            </button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
