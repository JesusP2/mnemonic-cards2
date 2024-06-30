export type Profile = {
  email: string | null;
  username: string;
  isOauth: boolean;
  avatar: string | null;
};

export type Result<T, E extends Error> =
  | { success: true; data: T }
  | { success: false; error: E };
