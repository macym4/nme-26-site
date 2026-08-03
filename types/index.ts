export type ProfileFormState = {
  success?: string;
  errors?: Record<string, string>;
};

export type TagRecord = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
};

export type ImageRecord = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  profileId: string;
  createdAt: Date;
};

export type CustomFieldRecord = {
  id: string;
  label: string;
  value: string;
  sortOrder: number;
  profileId: string;
};

export type ProfileRecord = {
  id: string;
  name: string;
  slug: string;
  shortBio: string;
  fullBio: string;
  category: string;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  email: string | null;
  instagram: string | null;
  website: string | null;
  mainImage: string | null;
};

export type ProfileTagRecord = {
  profileId: string;
  tagId: string;
  tag: TagRecord;
};

export type SiteContentRecord = {
  key: string;
  title: string;
  body: string;
  updatedAt: Date;
};
