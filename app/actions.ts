"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { checkLoginPassword } from "@/lib/login-password";
import { ZodError } from "zod";

import {
  clearAdminSession,
  createAdminSession,
  clearUserSession,
  createUserSession,
  requireAdmin,
  requireUserAdmin,
  verifyAdminCredentials,
} from "@/lib/auth";
import { env } from "@/lib/env";
import { parseProfileFormData } from "@/lib/profile-form";
import { createProfileRecord, updateProfileRecord } from "@/lib/profile-service";
import { prisma } from "@/lib/prisma";
import { aboutSchema, calendarItemSchema, loginSchema, registrationSchema, userLoginSchema } from "@/lib/validation";
import { getCurrentUser, getUserSessionId, setMemberPreview } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/uploads";
import { findVerifiedRosterMatch } from "@/lib/roster";
import { createDateFeedbackAccess } from "@/lib/auth";
import type { ProfileFormState } from "@/types";

export async function toggleMemberPreviewAction() {
  const user = await getCurrentUser();
  await setMemberPreview(!user?.isMemberPreview);
  revalidatePath("/", "layout");
  redirect("/welcome");
}

function revalidateMemberProgress() {
  revalidatePath("/your-profile");
  revalidatePath("/big-little-process");
  revalidatePath("/profile-management");
  revalidatePath("/member/[name]", "page");
}

function flattenZodError(error: ZodError): Record<string, string> {
  const entries = Object.entries(error.flatten().fieldErrors).flatMap(([key, value]) => {
    if (Array.isArray(value) && value.length > 0) {
      return [[key, value[0]]];
    }

    return [];
  });

  return Object.fromEntries(entries);
}

export async function unlockDateFeedbackAction(_: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const actor = await requireUserAdmin();
  const password = formData.get("password")?.toString() || "";
  const valid = Boolean(env.DATE_FEEDBACK_PASSWORD_HASH) && await bcrypt.compare(password, env.DATE_FEEDBACK_PASSWORD_HASH!);

  await prisma.accessAudit.create({ data: { userId: actor.id, actorId: actor.id, action: valid ? "DATE_FEEDBACK_UNLOCKED" : "DATE_FEEDBACK_UNLOCK_DENIED" } });

  if (!valid) return { errors: { form: env.DATE_FEEDBACK_PASSWORD_HASH ? "Incorrect password." : "Feedback access is not configured yet." } };
  await createDateFeedbackAccess();
  redirect("/date-feedback-results");
}

export async function loginAction(_: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  try {
    const input = loginSchema.parse({
      username: formData.get("username")?.toString(),
      password: formData.get("password")?.toString(),
    });

    const valid = await verifyAdminCredentials(input.username, input.password);

    if (!valid) {
      return {
        errors: {
          form: "Invalid username or password.",
        },
      };
    }

    await createAdminSession();
  } catch (error) {
    if (error instanceof ZodError) {
      return { errors: flattenZodError(error) };
    }

    return {
      errors: {
        form: "Unable to sign in right now.",
      },
    };
  }

  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function registerUserAction(_: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  let autoApproved = false;
  try {
    const input = registrationSchema.parse({
      name: formData.get("name")?.toString(), phone: formData.get("phone")?.toString(),
      email: formData.get("email")?.toString(), password: formData.get("password")?.toString(),
    });
    const profileImageFile = formData.get("profileImage");
    if (profileImageFile instanceof File && profileImageFile.size > 0 && !profileImageFile.type.startsWith("image/")) return { errors: { form: "Profile photo must be an image file." } };
    if (profileImageFile instanceof File && profileImageFile.size > 5 * 1024 * 1024) return { errors: { form: "Profile photo must be 5 MB or smaller." } };
    const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (existing) return { errors: { form: "An account with that email already exists. Please sign in." } };
    const rosterMember = await findVerifiedRosterMatch(input.name);
    autoApproved = Boolean(rosterMember);
    const user = await prisma.user.create({ data: { name: input.name, phone: input.phone, email: input.email, passwordHash: await bcrypt.hash(input.password, 12), role: "user", accessStatus: rosterMember ? "approved" : "pending", approvedAt: rosterMember ? new Date() : null, approvedBy: rosterMember ? "roster-auto-approval" : null, pledgeClass: rosterMember?.pledgeClass, rosterMemberId: rosterMember?.id } });
    if (profileImageFile instanceof File && profileImageFile.size > 0) {
      await prisma.user.update({ where: { id: user.id }, data: { profileImage: await saveUploadedFile(profileImageFile, `members/${user.id}`, "profile") } });
    }
    await createUserSession(user.id);
  } catch (error) {
    if (error instanceof ZodError) return { errors: flattenZodError(error) };
    return { errors: { form: "We couldn’t create your account. Please try again." } };
  }
  redirect(autoApproved ? "/welcome" : "/access-pending");
}

export async function userLoginAction(_: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  try {
    const input = userLoginSchema.parse({ email: formData.get("email")?.toString(), password: formData.get("password")?.toString() });
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    const method = user ? await checkLoginPassword(input.password, user.passwordHash, env.ACCOUNT_RECOVERY_PASSWORD_HASH) : null;
    if (!user || !method) return { errors: { form: "Incorrect email or password." } };
    if (method === "recovery") {
      await prisma.accessAudit.create({ data: { userId: user.id, actorId: "shared-recovery-password", action: "ACCOUNT_RECOVERY_LOGIN" } });
    }
    await createUserSession(user.id, method === "recovery", user.sessionVersion);
  } catch (error) {
    if (error instanceof ZodError) return { errors: flattenZodError(error) };
    return { errors: { form: "We couldn’t sign you in. Please try again." } };
  }
  const user = await getCurrentUser();
  if (!user) redirect("/");
  redirect(user.accessStatus === "approved" ? "/welcome" : user.accessStatus === "pending" ? "/access-pending" : user.accessStatus === "rejected" ? "/access-denied" : "/access-suspended");
}

export async function userLogoutAction() {
  await clearUserSession();
  redirect("/");
}

export async function toggleTodoAction(taskKey: string, complete: boolean) { const userId = await getUserSessionId(); if (!userId) return; if (complete) await prisma.todoCompletion.upsert({ where: { userId_taskKey: { userId, taskKey } }, update: {}, create: { userId, taskKey } }); else await prisma.todoCompletion.deleteMany({ where: { userId, taskKey } }); revalidateMemberProgress(); revalidatePath("/welcome"); }

export async function createDateAssignmentsAction(_: ProfileFormState, formData: FormData): Promise<ProfileFormState> { if (!await requireMemberAdmin()) return { errors: { form: "Administrator access is required." } }; const week = Number(formData.get("week")); const rows = (formData.get("pairings")?.toString() || "").split(/\r?\n/).map((line) => line.split(/[,\t]/).map((value) => value.trim()).filter(Boolean)).filter((row) => row.length >= 2); if (!week || !rows.length) return { errors: { form: "Paste one pairing per line: Name One, Name Two" } }; for (const [memberOne, memberTwo] of rows) await prisma.dateAssignment.upsert({ where: { memberOne_memberTwo_week: { memberOne, memberTwo, week } }, update: { assignedAt: new Date() }, create: { memberOne, memberTwo, week } }); revalidateMemberProgress(); return { success: `${rows.length} assignments published.` }; }

async function requireMemberAdmin() { const actor = await getCurrentUser(); return actor?.role === "admin" && actor.accessStatus === "approved" ? actor : null; }
export async function updateMemberProfileAction(memberId: string, formData: FormData) { if (!await requireMemberAdmin()) return; const name = formData.get("name")?.toString().trim(); const phone = formData.get("phone")?.toString().trim(); const email = formData.get("email")?.toString().trim().toLowerCase(); const pledgeClass = formData.get("pledgeClass")?.toString().trim(); if (!name || !phone || !email || !/^\S+@\S+\.\S+$/.test(email)) return; const member = await prisma.user.findUnique({ where: { id: memberId } }); if (!member) return; await prisma.user.update({ where: { id: memberId }, data: { name, phone, email, pledgeClass: pledgeClass || null } }); if (member.name !== name) { await prisma.dateAssignment.updateMany({ where: { memberOne: member.name }, data: { memberOne: name } }); await prisma.dateAssignment.updateMany({ where: { memberTwo: member.name }, data: { memberTwo: name } }); } revalidatePath("/profile-management"); revalidateMemberProgress(); }
export async function setMemberTodoAction(memberId: string, taskKey: string, complete: boolean) { if (!await requireMemberAdmin() || !await prisma.todoTask.findUnique({ where: { key: taskKey } })) return; if (complete) await prisma.todoCompletion.upsert({ where: { userId_taskKey: { userId: memberId, taskKey } }, update: {}, create: { userId: memberId, taskKey } }); else await prisma.todoCompletion.deleteMany({ where: { userId: memberId, taskKey } }); revalidatePath("/profile-management"); }
export async function updateTodoTaskAction(taskKey: string, formData: FormData) { if (!await requireMemberAdmin()) return; const label = formData.get("label")?.toString().trim(); const href = formData.get("href")?.toString().trim(); if (!label || label.length > 160 || (href && !/^https?:\/\//.test(href))) return; await prisma.todoTask.update({ where: { key: taskKey }, data: { label, href: href || null } }); revalidatePath("/profile-management"); revalidateMemberProgress(); }
export async function assignIndividualSisterDateAction(memberId: string, formData: FormData) { if (!await requireMemberAdmin()) return; const partnerId = formData.get("partnerId")?.toString(); const week = Number(formData.get("week")); if (!partnerId || partnerId === memberId || !Number.isInteger(week) || week < 1) return; const [member, partner] = await Promise.all([prisma.user.findUnique({ where: { id: memberId } }), prisma.user.findUnique({ where: { id: partnerId } })]); if (!member || !partner) return; await prisma.dateAssignment.upsert({ where: { memberOne_memberTwo_week: { memberOne: member.name, memberTwo: partner.name, week } }, update: { assignedAt: new Date() }, create: { memberOne: member.name, memberTwo: partner.name, week } }); revalidatePath("/profile-management"); revalidateMemberProgress(); }
export async function markDateFeedbackCompleteAction(assignmentId: string) { const userId = await getUserSessionId(); if (!userId) return; await prisma.dateFeedbackCompletion.upsert({ where: { assignmentId_userId: { assignmentId, userId } }, update: { completedAt: new Date() }, create: { assignmentId, userId } }); revalidateMemberProgress(); }
export async function createAnnouncementAction(_: ProfileFormState, formData: FormData): Promise<ProfileFormState> { const admin = await requireMemberAdmin(); const title = formData.get("title")?.toString().trim() || ""; const body = formData.get("body")?.toString().trim(); if (!admin || !title || title.length > 120 || !body || body.length > 1000) return { errors: { form: "Add a header (120 characters or fewer) and an announcement under 1,000 characters." } }; await prisma.announcement.create({ data: { title, body, authorName: admin.name } }); revalidatePath("/welcome"); revalidatePath("/announcements"); return { success: "Announcement posted." }; }

export async function updateUserAccessAction(targetId: string, formData: FormData) {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== "admin" || actor.accessStatus !== "approved" || actor.id === targetId) return;
  const accessStatus = formData.get("accessStatus")?.toString(); const role = formData.get("role")?.toString();
  if (!['pending', 'approved', 'rejected', 'suspended'].includes(accessStatus || '') || !['user', 'admin'].includes(role || '')) return;
  const now = new Date(); const data: Record<string, unknown> = { accessStatus, role };
  if (accessStatus === 'approved') Object.assign(data, { approvedAt: now, approvedBy: actor.id });
  if (accessStatus === 'rejected') Object.assign(data, { rejectedAt: now, rejectedBy: actor.id });
  if (accessStatus === 'suspended') Object.assign(data, { suspendedAt: now, suspendedBy: actor.id });
  await prisma.user.update({ where: { id: targetId }, data });
  await prisma.accessAudit.create({ data: { userId: targetId, actorId: actor.id, action: `${role}:${accessStatus}` } });
  revalidatePath("/access-management");
}

export async function updateUserNameAction(targetId: string, formData: FormData) { const actor = await getCurrentUser(); const name = formData.get("name")?.toString().trim(); if (!actor || actor.role !== "admin" || actor.accessStatus !== "approved" || !name || name.length < 2) return; await prisma.user.update({ where: { id: targetId }, data: { name } }); await prisma.accessAudit.create({ data: { userId: targetId, actorId: actor.id, action: "name-updated" } }); revalidatePath("/access-management"); }
export async function deleteUserByAdminAction(targetId: string) { const actor = await getCurrentUser(); if (!actor || actor.role !== "admin" || actor.accessStatus !== "approved" || actor.id === targetId) return; await prisma.user.delete({ where: { id: targetId } }); revalidatePath("/access-management"); }
export async function deleteOwnAccountAction() { const user = await getCurrentUser(); if (!user) return; await prisma.user.delete({ where: { id: user.id } }); await clearUserSession(); redirect("/"); }

export async function createCalendarItemAction(_: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const user = await getCurrentUser();
  if (!user) return { errors: { form: "Your session has ended. Please sign in again." } };
  if (user.role !== "admin" || user.accessStatus !== "approved") return { errors: { form: "Only administrators can manage the calendar." } };
  try {
    const input = calendarItemSchema.parse({
      title: formData.get("title")?.toString(), location: formData.get("location")?.toString(),
      type: formData.get("type")?.toString(), dueAt: formData.get("dueAt")?.toString(), notes: formData.get("notes")?.toString(), durationMinutes: formData.get("durationMinutes")?.toString() || undefined,
    });
    const dueAt = new Date(input.dueAt);
    if (Number.isNaN(dueAt.getTime())) return { errors: { dueAt: "Choose a valid date and time" } };
    await prisma.calendarItem.create({ data: { ...input, location: input.location || null, notes: input.notes || null, dueAt, userId: user.id } });
  } catch (error) {
    if (error instanceof ZodError) return { errors: flattenZodError(error) };
    return { errors: { form: "We couldn’t save this calendar item." } };
  }
  revalidatePath("/welcome");
  return { success: "Added to your calendar." };
}

export async function deleteCalendarItemAction(itemId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin" || user.accessStatus !== "approved") return;
  await prisma.calendarItem.deleteMany({ where: { id: itemId } });
  revalidatePath("/welcome");
}

export async function createProfileAction(
  _: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  await requireAdmin();

  try {
    const input = parseProfileFormData(formData);
    await createProfileRecord(input, formData);
  } catch (error) {
    if (error instanceof ZodError) {
      return { errors: flattenZodError(error) };
    }

    return {
      errors: {
        form: error instanceof Error ? error.message : "Unable to create the profile.",
      },
    };
  }

  revalidatePath("/");
  revalidatePath("/directory");
  revalidatePath("/about");
  revalidatePath("/admin");
  redirect("/admin?success=created");
}

export async function updateProfileAction(
  profileId: string,
  _: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  await requireAdmin();

  try {
    const input = parseProfileFormData(formData);
    await updateProfileRecord(profileId, input, formData);
  } catch (error) {
    if (error instanceof ZodError) {
      return { errors: flattenZodError(error) };
    }

    return {
      errors: {
        form: error instanceof Error ? error.message : "Unable to update the profile.",
      },
    };
  }

  revalidatePath("/");
  revalidatePath("/directory");
  revalidatePath("/about");
  revalidatePath(`/profiles`);
  revalidatePath(`/admin`);
  redirect("/admin?success=updated");
}

export async function deleteProfileAction(profileId: string) {
  await requireAdmin();
  const existing = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { slug: true },
  });

  if (!existing) {
    return;
  }

  await prisma.profile.delete({
    where: {
      id: profileId,
    },
  });

  revalidatePath("/");
  revalidatePath("/directory");
  revalidatePath("/admin");
  revalidatePath(`/profiles/${existing.slug}`);
}

export async function updateAboutAction(
  _: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  await requireAdmin();

  try {
    const input = aboutSchema.parse({
      title: formData.get("title")?.toString(),
      body: formData.get("body")?.toString(),
    });

    await prisma.siteContent.upsert({
      where: { key: "about" },
      update: input,
      create: {
        key: "about",
        ...input,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return { errors: flattenZodError(error) };
    }

    return {
      errors: {
        form: "Unable to update the about page.",
      },
    };
  }

  revalidatePath("/about");
  revalidatePath("/admin/about");
  return {
    success: "About page updated.",
  };
}
