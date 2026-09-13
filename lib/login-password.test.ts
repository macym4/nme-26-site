import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { checkLoginPassword } from "./login-password";

test("existing account passwords work with recovery enabled or disabled", async () => {
  const account = await bcrypt.hash("member-password", 4);
  const recovery = await bcrypt.hash("private-recovery-password", 4);
  assert.equal(await checkLoginPassword("member-password", account), "account");
  assert.equal(await checkLoginPassword("member-password", account, recovery), "account");
  assert.equal(await checkLoginPassword("wrong-password", account, recovery), null);
});

test("shared recovery password is opt-in and changing the hash revokes the old password", async () => {
  const account = await bcrypt.hash("member-password", 4);
  const recovery = await bcrypt.hash("private-recovery-password", 4);
  assert.equal(await checkLoginPassword("private-recovery-password", account), null);
  assert.equal(await checkLoginPassword("private-recovery-password", account, ""), null);
  assert.equal(await checkLoginPassword("private-recovery-password", account, recovery), "recovery");
  assert.equal(await checkLoginPassword("private-recovery-password", account, await bcrypt.hash("replacement-password", 4)), null);
});
