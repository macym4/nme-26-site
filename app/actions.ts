"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";

import {
  clearAdminSession,
  createAdminSession,
  clearUserSession,
  createUserSession,
  requireAdmin,
  verifyAdminCredentials,
} from "@/lib/auth";
import { parseProfileFormData } from "@/lib/profile-form";
import { createProfileRecord, updateProfileRecord } from "@/lib/profile-service";
import { prisma } from "@/lib/prisma";
import { aboutSchema, calendarItemSchema, loginSchema, registrationSchema, userLoginSchema } from "@/lib/validation";
import { getCurrentUser, getUserSessionId } from "@/lib/auth";
import type { ProfileFormState } from "@/types";

function flattenZodError(error: ZodError): Record<string, string> {
  const entries = Object.entries(error.flatten().fieldErrors).flatMap(([key, value]) => {
    if (Array.isArray(value) && value.length > 0) {
      return [[key, value[0]]];
    }

    return [];
  });

  return Object.fromEntries(entries);
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
  try {
    const input = registrationSchema.parse({
      name: formData.get("name")?.toString(), phone: formData.get("phone")?.toString(),
      email: formData.get("email")?.toString(), password: formData.get("password")?.toString(),
    });
    const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (existing) return { errors: { form: "An account with that email already exists. Please sign in." } };
    const user = await prisma.user.create({ data: { name: input.name, phone: input.phone, email: input.email, passwordHash: await bcrypt.hash(input.password, 12), role: "user", accessStatus: "pending" } });
    await createUserSession(user.id);
  } catch (error) {
    if (error instanceof ZodError) return { errors: flattenZodError(error) };
    return { errors: { form: "We couldn’t create your account. Please try again." } };
  }
  redirect("/access-pending");
}

export async function userLoginAction(_: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  try {
    const input = userLoginSchema.parse({ email: formData.get("email")?.toString(), password: formData.get("password")?.toString() });
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return { errors: { form: "Incorrect email or password." } };
    await createUserSession(user.id);
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

export async function toggleTodoAction(taskKey: string, complete: boolean) { const userId = await getUserSessionId(); if (!userId) return; if (complete) await prisma.todoCompletion.upsert({ where: { userId_taskKey: { userId, taskKey } }, update: {}, create: { userId, taskKey } }); else await prisma.todoCompletion.deleteMany({ where: { userId, taskKey } }); revalidatePath("/your-profile"); revalidatePath("/welcome"); }

export async function createDateAssignmentsAction(_: ProfileFormState, formData: FormData): Promise<ProfileFormState> { const week = Number(formData.get("week")); const rows = (formData.get("pairings")?.toString() || "").split(/\r?\n/).map((line) => line.split(/[,\t]/).map((value) => value.trim()).filter(Boolean)).filter((row) => row.length >= 2); if (!week || !rows.length) return { errors: { form: "Paste one pairing per line: Name One, Name Two" } }; for (const [memberOne, memberTwo] of rows) await prisma.dateAssignment.upsert({ where: { memberOne_memberTwo_week: { memberOne, memberTwo, week } }, update: { assignedAt: new Date() }, create: { memberOne, memberTwo, week } }); revalidatePath("/your-profile"); return { success: `${rows.length} assignments published.` }; }

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
  const userId = await getUserSessionId();
  if (!userId) return { errors: { form: "Your session has ended. Please sign in again." } };
  try {
    const input = calendarItemSchema.parse({
      title: formData.get("title")?.toString(), location: formData.get("location")?.toString(),
      type: formData.get("type")?.toString(), dueAt: formData.get("dueAt")?.toString(), notes: formData.get("notes")?.toString(), durationMinutes: formData.get("durationMinutes")?.toString() || undefined,
    });
    const dueAt = new Date(input.dueAt);
    if (Number.isNaN(dueAt.getTime())) return { errors: { dueAt: "Choose a valid date and time" } };
    await prisma.calendarItem.create({ data: { ...input, location: input.location || null, notes: input.notes || null, dueAt, userId } });
  } catch (error) {
    if (error instanceof ZodError) return { errors: flattenZodError(error) };
    return { errors: { form: "We couldn’t save this calendar item." } };
  }
  revalidatePath("/welcome");
  return { success: "Added to your calendar." };
}

export async function deleteCalendarItemAction(itemId: string) {
  const userId = await getUserSessionId();
  if (!userId) return;
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
