import { createHmac, timingSafeEqual } from "node:crypto";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "directory-admin-session";
const USER_SESSION_COOKIE = "aster-user-session";
const DATE_FEEDBACK_COOKIE = "date-feedback-access";
const MEMBER_PREVIEW_COOKIE = "member-view-preview";

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
  cookieStore.delete(MEMBER_PREVIEW_COOKIE);
  cookieStore.delete(DATE_FEEDBACK_COOKIE);
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

export async function getCurrentUser() {
  const id = await getUserSessionId();
  const user = id ? await prisma.user.findUnique({ where: { id }, include: { rosterMember: true } }) : null;
  if (!user) return null;
  const isActualAdmin = user.role === "admin" && user.accessStatus === "approved";
  const isMemberPreview = isActualAdmin && (await cookies()).get(MEMBER_PREVIEW_COOKIE)?.value === user.id;
  return { ...user, role: isMemberPreview ? "user" : user.role, isActualAdmin, isMemberPreview };
}

export async function setMemberPreview(enabled: boolean) {
  const user = await getCurrentUser();
  if (!user?.isActualAdmin) redirect("/welcome");
  const store = await cookies();
  if (enabled) {
    store.set(MEMBER_PREVIEW_COOKIE, user.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
  } else {
    store.delete(MEMBER_PREVIEW_COOKIE);
  }
}
export async function requireApprovedUser() { const user = await getCurrentUser(); if (!user) redirect("/"); if (user.accessStatus === "pending") redirect("/access-pending"); if (user.accessStatus === "rejected") redirect("/access-denied"); if (user.accessStatus === "suspended") redirect("/access-suspended"); if (user.accessStatus !== "approved") redirect("/"); return user; }
export async function requireUserAdmin() { const user = await requireApprovedUser(); if (user.role !== "admin") redirect("/welcome"); return user; }
export async function hasDateFeedbackAccess() { const store = await cookies(); const value = store.get(DATE_FEEDBACK_COOKIE)?.value; const expected = `feedback:${sign("date-feedback")}`; return Boolean(value && value.length === expected.length && timingSafeEqual(Buffer.from(value), Buffer.from(expected))); }
export async function createDateFeedbackAccess() { const store = await cookies(); store.set(DATE_FEEDBACK_COOKIE, `feedback:${sign("date-feedback")}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 4 }); }
export async function clearDateFeedbackAccess() { const store = await cookies(); store.delete(DATE_FEEDBACK_COOKIE); }
