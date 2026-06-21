export {};

declare global {
  interface Window {
    openCodePlusPlus: {
      selectRepo: () => Promise<string | undefined>;
      runTask: (input: { repo: string; task: string }) => Promise<{ pid?: number | null; command?: string; args?: string[]; error?: string }>;
      stopTask: () => Promise<{ stopped: boolean }>;
      getLatestReport: (repo: string) => Promise<string | undefined>;
      openLatestReport: (repo: string) => Promise<{ opened: boolean; path?: string; error?: string }>;
      onTaskOutput: (handler: (event: { stream: "stdout" | "stderr" | "system"; text: string }) => void) => () => void;
      onTaskExit: (handler: (event: { code: number | null; signal: string | null; reportPath?: string; error?: string }) => void) => () => void;
    };
  }
}
