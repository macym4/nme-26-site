import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const env = { ...process.env };
let certificateDirectory;
// Older Node releases do not support --use-system-ca on Windows. Extend their
// CA bundle with the roots Windows already trusts; keep TLS verification on.
if (process.platform === "win32" && !env.NODE_EXTRA_CA_CERTS) {
  try {
    const certificates = execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", String.raw`
      $ErrorActionPreference = 'Stop'
      Get-ChildItem Cert:\CurrentUser\Root, Cert:\LocalMachine\Root |
        Sort-Object Thumbprint -Unique | ForEach-Object {
          '-----BEGIN CERTIFICATE-----'
          [Convert]::ToBase64String($_.RawData, [Base64FormattingOptions]::InsertLineBreaks)
          '-----END CERTIFICATE-----'
        }
    `], { encoding: "utf8", windowsHide: true });
    certificateDirectory = mkdtempSync(join(tmpdir(), "aphi-dev-ca-"));
    env.NODE_EXTRA_CA_CERTS = join(certificateDirectory, "trusted-roots.pem");
    writeFileSync(env.NODE_EXTRA_CA_CERTS, certificates);
  } catch {
    console.warn("Could not read Windows trusted certificates; using Node's default certificate store.");
  }
}
const child = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", ...process.argv.slice(2)], { env, stdio: "inherit", windowsHide: true });
child.on("exit", (code) => {
  if (certificateDirectory) {
    unlinkSync(join(certificateDirectory, "trusted-roots.pem"));
    rmdirSync(certificateDirectory);
  }
  process.exitCode = code ?? 1;
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
