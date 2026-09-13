import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { finishPasswordReset, setTemporaryPassword, validateNewPassword } from "./password-reset";
import { userSessionToken, validUserSession } from "./user-session";

let directory: string;
let db: PrismaClient;
const original = "original-test-password";
const temporary = "temporary-test-password";
const replacement = "replacement-test-password";
const secret = "test-only-session-secret";

before(async () => {
  directory = await mkdtemp(path.join(process.cwd(), "prisma", ".password-reset-test-"));
  await writeFile(path.join(directory, "test.db"), "");
  const url = `file:./${path.basename(directory)}/test.db`;
  execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "db", "push", "--schema", "prisma/schema.sqlite.prisma", "--skip-generate"], { env: { ...process.env, DATABASE_URL: url }, stdio: "pipe" });
  db = new PrismaClient({ datasources: { db: { url } } });
  const passwordHash = await bcrypt.hash(original, 4);
  for (const [id, role, accessStatus] of [["admin", "admin", "approved"], ["member", "user", "approved"], ["suspended", "admin", "suspended"]]) {
    await db.user.create({ data: { id, name: id, phone: "0000000000", email: `${id}@example.test`, role, accessStatus, passwordHash } });
  }
});

after(async () => {
  await db?.$disconnect();
  if (directory) {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve("prisma"));
    assert.ok(path.basename(directory).startsWith(".password-reset-test-"));
    await rm(directory, { recursive: true, force: true });
  }
});

test("denies non-admins, suspended admins, and self-reset without changing passwords", async () => {
  await assert.rejects(setTemporaryPassword(db, "member", "admin", temporary, temporary), /Administrator/);
  await assert.rejects(setTemporaryPassword(db, "suspended", "member", temporary, temporary), /Administrator/);
  await assert.rejects(setTemporaryPassword(db, "admin", "admin", temporary, temporary), /another member/);
  assert.equal(await db.accessAudit.count(), 0);
  assert.equal((await db.user.findUniqueOrThrow({ where: { id: "member" } })).sessionVersion, 0);
});

test("reset invalidates sessions and completion replaces the temporary password exactly once", async () => {
  const oldSession = userSessionToken("member", 0, secret);
  const oldRecovery = userSessionToken("member", 0, secret, "recovery-hash");
  await setTemporaryPassword(db, "admin", "member", temporary, temporary);
  const user = await db.user.findUniqueOrThrow({ where: { id: "member" } });
  assert.equal(user.mustChangePassword, true);
  assert.equal(user.sessionVersion, 1);
  assert.equal(await bcrypt.compare(original, user.passwordHash), false);
  assert.equal(await bcrypt.compare(temporary, user.passwordHash), true);
  assert.equal(validUserSession(oldSession, 1, secret), false);
  assert.equal(validUserSession(oldRecovery, 1, secret, "recovery-hash"), false);
  await assert.rejects(finishPasswordReset(db, "member", temporary, temporary), /different/);
  const temporarySession = userSessionToken("member", 1, secret);
  await finishPasswordReset(db, "member", replacement, replacement);
  const changed = await db.user.findUniqueOrThrow({ where: { id: "member" } });
  assert.equal(changed.mustChangePassword, false);
  assert.equal(changed.sessionVersion, 2);
  assert.equal(validUserSession(temporarySession, 2, secret), false);
  assert.equal(await bcrypt.compare(replacement, changed.passwordHash), true);
  assert.equal(await bcrypt.compare(temporary, changed.passwordHash), false);
  await assert.rejects(finishPasswordReset(db, "member", replacement, replacement), /No password change/);
  assert.deepEqual((await db.accessAudit.findMany({ orderBy: { createdAt: "asc" } })).map((entry) => entry.action), ["ADMIN_PASSWORD_RESET", "PASSWORD_CHANGE_COMPLETED"]);
});

test("session validation rejects tampering, stale versions, and revoked recovery configuration", () => {
  const token = userSessionToken("member", 2, secret);
  assert.equal(validUserSession(token, 2, secret), true);
  assert.equal(validUserSession(token.replace("member", "admin"), 2, secret), false);
  assert.equal(validUserSession(token + ":extra", 2, secret), false);
  const recovery = userSessionToken("member", 2, secret, "recovery-hash");
  assert.equal(validUserSession(recovery, 2, secret, "recovery-hash"), true);
  assert.equal(validUserSession(recovery, 2, secret), false);
  assert.equal(validUserSession(recovery, 2, secret, "changed-hash"), false);
  const legacy = `member:${createHmac("sha256", secret).update("member").digest("hex")}`;
  assert.equal(validUserSession(legacy, 0, secret), true);
  assert.equal(validUserSession(legacy, 1, secret), false);
});

test("validates confirmation and bcrypt byte limit", () => {
  assert.throws(() => validateNewPassword("short", "short"), /8 characters/);
  assert.throws(() => validateNewPassword(temporary, "mismatch"), /do not match/);
  assert.throws(() => validateNewPassword("é".repeat(37), "é".repeat(37)), /72 bytes/);
});
