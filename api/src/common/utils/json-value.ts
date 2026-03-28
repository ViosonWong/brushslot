import { Prisma } from '@prisma/client';

export function toJsonValue(
  payload?: unknown,
): Prisma.InputJsonValue | undefined {
  if (payload === undefined) return undefined;
  return JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue;
}
