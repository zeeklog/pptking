import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AccessControlStore {
  accessCode: string;
  token: string;
  needCode: boolean;
  hideUserApiKey: boolean;
  hideBalanceQuery: boolean;
  disableGPT4: boolean;
  disableFastLink: boolean;
  openaiUrl: string;

  updateCode: (code: string) => void;
  updateToken: (token: string) => void;
  goToPath: (path: string) => void;
}

export const useAccessStore = create<AccessControlStore>()(
  persist(
    (set, get) => ({
      accessCode: "",
      token: "",
      needCode: false,
      hideUserApiKey: false,
      hideBalanceQuery: false,
      disableGPT4: false,
      disableFastLink: false,
      openaiUrl: "",

      updateCode(code: string) {
        set({ accessCode: code });
      },

      updateToken(token: string) {
        set({ token });
      },

      goToPath(path: string) {
        // Simple navigation - in a real app you might use router
        window.location.href = path;
      },
    }),
    {
      name: "access-control",
    },
  ),
);
