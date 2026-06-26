import { setAuthTokenGetter } from "@workspace/api-client-react";

export function initApi() {
  setAuthTokenGetter(() => localStorage.getItem("feedora_token"));
}
