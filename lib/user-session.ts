import { createHmac, timingSafeEqual } from "node:crypto";

const sign = (value: string, secret: string) => createHmac("sha256", secret).update(value).digest("hex");

export function userSessionToken(id: string, version: number, secret: string, recoveryHash?: string) {
  const mode = recoveryHash ? "recovery" : "account";
  const signature = sign(`session:${id}:${version}:${mode}:${recoveryHash || ""}`, secret);
  return `${id}:${signature}:${mode}:${version}`;
}

export function validUserSession(token: string, version: number, secret: string, recoveryHash?: string) {
  const [id, signature, mode, tokenVersion, ...rest] = token.split(":");
  if (!id || !signature || rest.length || (mode && mode !== "account" && mode !== "recovery")) return false;
  if (mode === "recovery" && !recoveryHash) return false;
  let expected: string;
  if (tokenVersion === undefined) {
    // Preserve existing sessions only until the first password reset/change.
    if (version !== 0 || mode === "account") return false;
    expected = sign(mode === "recovery" ? `recovery:${id}:${recoveryHash}` : id, secret);
  } else {
    if (!mode || tokenVersion !== String(version)) return false;
    expected = sign(`session:${id}:${version}:${mode}:${mode === "recovery" ? recoveryHash : ""}`, secret);
  }
  const actualBytes = Buffer.from(signature), expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}
