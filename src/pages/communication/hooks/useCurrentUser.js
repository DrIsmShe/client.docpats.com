// client/src/hooks/useCurrentUser.js

import { useEffect, useState } from "react";
import { getSession } from "../../../api/session";
export const useCurrentUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // getSession() de-dupes concurrent calls and caches the result,
        // so many components sharing this hook cost ONE network request.
        const data = await getSession();
        if (cancelled) return;
        setUser(data?.authenticated ? data.user : null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading };
};
