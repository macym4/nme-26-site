"use client";

import { useActionState, useState } from "react";

import type { ProfileWithRelations } from "@/lib/profile-service";
import type { ProfileFormState } from "@/types";

import { FormMessage } from "@/components/ui/form-message";
import { Input, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

type ProfileEditorProps = {
  action: (state: ProfileFormState, formData: FormData) => Promise<ProfileFormState>;
  profile?: ProfileWithRelations;
};

type FieldPair = {
  label: string;
  value: string;
};

export function ProfileEditor({ action, profile }: ProfileEditorProps) {
  const [state, formAction] = useActionState(action, {});
  const [tags, setTags] = useState<string[]>(profile?.profileTags.map(({ tag }) => tag.name) ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [customFields, setCustomFields] = useState<FieldPair[]>(
    profile?.customFields.map((field) => ({
      label: field.label,
      value: field.value,
    })) ?? [{ label: "", value: "" }],
  );
  const [galleryImages, setGalleryImages] = useState<string[]>(profile?.images.map((image) => image.url) ?? []);
  const [removedGalleryImages, setRemovedGalleryImages] = useState<string[]>([]);

  function addTag() {
    const value = tagDraft.trim();

    if (!value || tags.includes(value)) {
      return;
    }

    setTags((current) => [...current, value]);
    setTagDraft("");
  }

  function removeTag(tag: string) {
    setTags((current) => current.filter((item) => item !== tag));
  }

  function updateField(index: number, key: keyof FieldPair, value: string) {
    setCustomFields((current) =>
      current.map((field, fieldIndex) => (fieldIndex === index ? { ...field, [key]: value } : field)),
    );
  }

  function removeGalleryImage(url: string) {
    setGalleryImages((current) => current.filter((item) => item !== url));
    setRemovedGalleryImages((current) => [...current, url]);
  }

  return (
    <form action={formAction} className="space-y-6">
      <FormMessage error={state.errors?.form} success={state.success} />

      <section className="grid gap-5 rounded-[2rem] border border-[var(--line)] bg-white p-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--ink)]" htmlFor="name">
            Name
          </label>
          <Input defaultValue={profile?.name} id="name" name="name" placeholder="Full name" />
          <p className="text-xs text-[#b9392c]">{state.errors?.name}</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--ink)]" htmlFor="category">
            Category
          </label>
          <Input defaultValue={profile?.category} id="category" name="category" placeholder="Category" />
          <p className="text-xs text-[#b9392c]">{state.errors?.category}</p>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-[var(--ink)]" htmlFor="shortBio">
            Short bio
          </label>
          <Textarea defaultValue={profile?.shortBio} id="shortBio" name="shortBio" />
          <p className="text-xs text-[#b9392c]">{state.errors?.shortBio}</p>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-[var(--ink)]" htmlFor="fullBio">
            Full description
          </label>
          <Textarea defaultValue={profile?.fullBio} id="fullBio" name="fullBio" />
          <p className="text-xs text-[#b9392c]">{state.errors?.fullBio}</p>
        </div>
      </section>

      <section className="grid gap-5 rounded-[2rem] border border-[var(--line)] bg-white p-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--ink)]" htmlFor="email">
            Email
          </label>
          <Input defaultValue={profile?.email ?? ""} id="email" name="email" placeholder="name@example.com" />
          <p className="text-xs text-[#b9392c]">{state.errors?.email}</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--ink)]" htmlFor="website">
            Website
          </label>
          <Input defaultValue={profile?.website ?? ""} id="website" name="website" placeholder="https://example.com" />
          <p className="text-xs text-[#b9392c]">{state.errors?.website}</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--ink)]" htmlFor="instagram">
            Instagram
          </label>
          <Input
            defaultValue={profile?.instagram ?? ""}
            id="instagram"
            name="instagram"
            placeholder="https://instagram.com/username"
          />
          <p className="text-xs text-[#b9392c]">{state.errors?.instagram}</p>
        </div>
        <label className="flex items-center gap-3 rounded-2xl border border-[var(--line)] px-4 py-3 text-sm text-[var(--ink)]">
          <input defaultChecked={profile?.featured} name="featured" type="checkbox" />
          Featured profile
        </label>
      </section>

      <section className="space-y-5 rounded-[2rem] border border-[var(--line)] bg-white p-6">
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-[var(--ink)]" htmlFor="tagDraft">
              Tags
            </label>
            <Input
              id="tagDraft"
              onChange={(event) => setTagDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTag();
                }
              }}
              placeholder="Add a tag and press Enter"
              value={tagDraft}
            />
          </div>
          <button
            className="rounded-full border border-[var(--line)] px-4 py-3 text-sm font-semibold text-[var(--ink)]"
            onClick={(event) => {
              event.preventDefault();
              addTag();
            }}
            type="button"
          >
            Add tag
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              className="rounded-full border border-[var(--line)] bg-[var(--muted)] px-3 py-1 text-sm text-[var(--ink)]"
              onClick={() => removeTag(tag)}
              type="button"
            >
              {tag} ×
            </button>
          ))}
        </div>
        {tags.map((tag) => (
          <input key={tag} name="tags" type="hidden" value={tag} />
        ))}
      </section>

      <section className="space-y-5 rounded-[2rem] border border-[var(--line)] bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-[var(--ink)]">Custom fields</h2>
          <button
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
            onClick={(event) => {
              event.preventDefault();
              setCustomFields((current) => [...current, { label: "", value: "" }]);
            }}
            type="button"
          >
            Add field
          </button>
        </div>
        <div className="space-y-4">
          {customFields.map((field, index) => (
            <div key={`${index}-${field.label}`} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <Input
                onChange={(event) => updateField(index, "label", event.target.value)}
                placeholder="Label"
                value={field.label}
              />
              <Input
                onChange={(event) => updateField(index, "value", event.target.value)}
                placeholder="Value"
                value={field.value}
              />
              <button
                className="rounded-full border border-[var(--line)] px-4 py-3 text-sm font-semibold text-[var(--ink)]"
                onClick={(event) => {
                  event.preventDefault();
                  setCustomFields((current) => current.filter((_, fieldIndex) => fieldIndex !== index));
                }}
                type="button"
              >
                Remove
              </button>
              <input name="customFieldLabel" type="hidden" value={field.label} />
              <input name="customFieldValue" type="hidden" value={field.value} />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5 rounded-[2rem] border border-[var(--line)] bg-white p-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--ink)]" htmlFor="mainImageFile">
            Main image
          </label>
          <Input accept="image/*" id="mainImageFile" name="mainImageFile" type="file" />
          {profile?.mainImage ? (
            <label className="flex items-center gap-3 text-sm text-[var(--soft-ink)]">
              <input name="clearMainImage" type="checkbox" />
              Clear current main image if no replacement is uploaded
            </label>
          ) : null}
        </div>

        {galleryImages.length ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-[var(--ink)]">Current gallery</p>
            <div className="flex flex-wrap gap-3">
              {galleryImages.map((url) => (
                <div key={url} className="rounded-2xl border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)]">
                  <div className="max-w-48 truncate">{url}</div>
                  <button
                    className="mt-2 text-xs font-semibold text-[#b9392c]"
                    onClick={() => removeGalleryImage(url)}
                    type="button"
                  >
                    Remove
                  </button>
                  <input name="existingGalleryImages" type="hidden" value={url} />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {removedGalleryImages.map((url) => (
          <input key={url} name="removedGalleryImages" type="hidden" value={url} />
        ))}

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--ink)]" htmlFor="galleryImages">
            Upload gallery images
          </label>
          <Input accept="image/*" id="galleryImages" multiple name="galleryImages" type="file" />
        </div>
      </section>

      <SubmitButton label={profile ? "Save changes" : "Create profile"} pendingLabel="Saving profile..." />
    </form>
  );
}
