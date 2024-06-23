import { queryOptions } from "@tanstack/react-query";
import type { Profile } from "../types";

export const profileQueryOptions = queryOptions({
  queryKey: ['profile'],
  queryFn: async () => {
    const res = await fetch('/api/profile')
    if (!res.ok) {
      throw new Error('Could not validate user')
    }
    const json = await res.json()
    return json as Profile | null
  }
})
