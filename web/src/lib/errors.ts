export function getErrorMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;

  if (typeof error === "object") {
    const obj = error as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;

    const data = obj.data;
    if (data && typeof data === "object") {
      const dataObj = data as Record<string, unknown>;
      if (typeof dataObj.message === "string") return dataObj.message;
      if (Array.isArray(dataObj.message)) {
        return dataObj.message
          .filter((item): item is string => typeof item === "string")
          .join(", ");
      }
    }

    if (typeof obj.error === "string") return obj.error;
  }

  return "发生了未知错误";
}

