import { useCallback, useState } from "react";

export function useBusyState(idleError = "") {
  const [error, setError] = useState(idleError);
  const [loading, setLoading] = useState(false);

  const start = useCallback(() => {
    setError("");
    setLoading(true);
  }, []);

  const fail = useCallback((message: string) => {
    setError(message);
    setLoading(false);
  }, []);

  return { error, loading, start, fail, setError, setLoading };
}
