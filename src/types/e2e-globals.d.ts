export {};

declare global {
  interface Window {
    __E2E__?: boolean;
    __E2E_READY__?: boolean;
    __draft_op_done__?: number;
  }

  const __E2E__: boolean | undefined;
  const PLAYWRIGHT_BASE_URL: string | undefined;
  const VITE_E2E: string | undefined;
}
