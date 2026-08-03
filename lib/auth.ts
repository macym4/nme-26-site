import { createHmac, timingSafeEqual } from "node:crypto";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "directory-admin-session";
const USER_SESSION_COOKIE = "aster-user-session";

function sign(value: string) {
  return createHmac("sha256", env.SESSION_SECRET).update(value).digest("hex");
}

export async function verifyAdminCredentials(username: string, password: string) {
  if (username !== env.ADMIN_USERNAME) {
    return false;
  }

  return bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
}

export async function createAdminSession() {
  const token = `admin:${sign(env.ADMIN_USERNAME)}`;
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAuthenticated() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE)?.value;

  if (!cookie) {
    return false;
  }

  const expected = `admin:${sign(env.ADMIN_USERNAME)}`;
  const cookieBuffer = Buffer.from(cookie);
  const expectedBuffer = Buffer.from(expected);

  if (cookieBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(cookieBuffer, expectedBuffer);
}

export async function requireAdmin() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }
}

export async function createUserSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(USER_SESSION_COOKIE, `${userId}:${sign(userId)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  cookieStore.delete(USER_SESSION_COOKIE);
}

export async function getUserSessionId() {
  const cookieStore = await cookies();
  const value = cookieStore.get(USER_SESSION_COOKIE)?.value;
  if (!value) return null;

  const [userId, signature, ...rest] = value.split(":");
  if (!userId || !signature || rest.length) return null;
  const expected = sign(userId);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) return null;
  return userId;
}

export async function getCurrentUser() { const id = await getUserSessionId(); return id ? prisma.user.findUnique({ where: { id } }) : null; }
export async function requireApprovedUser() { const user = await getCurrentUser(); if (!user) redirect("/"); if (user.accessStatus === "pending") redirect("/access-pending"); if (user.accessStatus === "rejected") redirect("/access-denied"); if (user.accessStatus === "suspended") redirect("/access-suspended"); if (user.accessStatus !== "approved") redirect("/"); return user; }
export async function requireUserAdmin() { const user = await requireApprovedUser(); if (user.role !== "admin") redirect("/welcome"); return user; }
