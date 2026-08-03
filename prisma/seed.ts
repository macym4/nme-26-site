import { PrismaClient } from "@prisma/client";

import { slugify } from "../lib/slug";

const prisma = new PrismaClient();

const sampleProfiles = [
  {
    name: "Ava Sinclair",
    shortBio: "Community strategist focused on partnerships and growth.",
    fullBio:
      "Ava builds relationship-driven programs that connect founders, students, and local organizations. She blends systems thinking with warm, practical leadership.",
    category: "Community",
    featured: true,
    email: "ava@example.com",
    instagram: "https://instagram.com/ava.sinclair",
    website: "https://example.com/ava",
    tags: ["Leadership", "Partnerships", "Events"],
    customFields: [
      ["Location", "Boston, MA"],
      ["Focus", "Partnership strategy"],
    ],
  },
  {
    name: "Maya Brooks",
    shortBio: "Visual storyteller designing campaigns across digital and print.",
    fullBio:
      "Maya develops identity systems, photo direction, and editorial layouts with a strong eye for narrative. Her work balances clean composition with expressive color.",
    category: "Design",
    featured: true,
    email: "maya@example.com",
    instagram: "https://instagram.com/maya.brooks",
    website: "https://example.com/maya",
    tags: ["Branding", "Creative Direction", "Photography"],
    customFields: [
      ["Specialty", "Art direction"],
      ["Tools", "Figma, Adobe CC"],
    ],
  },
  {
    name: "Jordan Rivera",
    shortBio: "Engineer shipping product experiences with strong data instincts.",
    fullBio:
      "Jordan works across product, analytics, and frontend engineering to bring new ideas into production quickly. He cares about maintainable systems and clear decision making.",
    category: "Technology",
    featured: false,
    email: "jordan@example.com",
    instagram: "https://instagram.com/jordan.codes",
    website: "https://example.com/jordan",
    tags: ["Engineering", "Product", "Analytics"],
    customFields: [
      ["Role", "Full-stack engineer"],
      ["Interests", "Data products"],
    ],
  },
  {
    name: "Leila Carter",
    shortBio: "Program lead coordinating mentorship, workshops, and member support.",
    fullBio:
      "Leila designs thoughtful member experiences and keeps complex operations moving. She is especially strong at translating broad goals into repeatable processes.",
    category: "Operations",
    featured: true,
    email: "leila@example.com",
    instagram: "https://instagram.com/leila.carter",
    website: "https://example.com/leila",
    tags: ["Operations", "Mentorship", "Programs"],
    customFields: [
      ["Strength", "Program operations"],
      ["Availability", "Remote / hybrid"],
    ],
  },
  {
    name: "Noah Bennett",
    shortBio: "Research-minded builder exploring health, policy, and systems change.",
    fullBio:
      "Noah combines field research, synthesis, and public communication to turn complex topics into accessible insights. He enjoys projects that sit at the intersection of people and policy.",
    category: "Research",
    featured: false,
    email: "noah@example.com",
    instagram: "https://instagram.com/noah.bennett",
    website: "https://example.com/noah",
    tags: ["Research", "Policy", "Writing"],
    customFields: [
      ["Background", "Public policy"],
      ["Current work", "Health systems research"],
    ],
  },
  {
    name: "Sofia Kim",
    shortBio: "Marketing lead crafting launch plans and audience growth strategies.",
    fullBio:
      "Sofia brings structure to creative growth work, from campaign planning to performance review. She likes simple systems, crisp messaging, and teams that learn quickly.",
    category: "Marketing",
    featured: false,
    email: "sofia@example.com",
    instagram: "https://instagram.com/sofia.kim",
    website: "https://example.com/sofia",
    tags: ["Marketing", "Launches", "Growth"],
    customFields: [
      ["Channel focus", "Email + social"],
      ["Approach", "Audience-first strategy"],
    ],
  },
];

async function main() {
  await prisma.profileTag.deleteMany();
  await prisma.image.deleteMany();
  await prisma.customField.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.profile.deleteMany();

  await prisma.siteContent.upsert({
    where: { key: "about" },
    update: {
      title: "About This Directory",
      body: "Use this page to describe the purpose of your directory, who it serves, and how people should use it. The admin dashboard lets you update this content later without touching code.",
    },
    create: {
      key: "about",
      title: "About This Directory",
      body: "Use this page to describe the purpose of your directory, who it serves, and how people should use it. The admin dashboard lets you update this content later without touching code.",
    },
  });

  for (const [index, profile] of sampleProfiles.entries()) {
    const baseSlug = slugify(profile.name);
    const slug = index === 0 ? baseSlug : `${baseSlug}-${index + 1}`;

    await prisma.profile.create({
      data: {
        name: profile.name,
        slug,
        shortBio: profile.shortBio,
        fullBio: profile.fullBio,
        category: profile.category,
        featured: profile.featured,
        email: profile.email,
        instagram: profile.instagram,
        website: profile.website,
        mainImage: `/api/seed-image/${slug}?variant=main`,
        images: {
          create: [
            {
              url: `/api/seed-image/${slug}?variant=gallery-1`,
              alt: `${profile.name} gallery image 1`,
              sortOrder: 0,
            },
            {
              url: `/api/seed-image/${slug}?variant=gallery-2`,
              alt: `${profile.name} gallery image 2`,
              sortOrder: 1,
            },
          ],
        },
        customFields: {
          create: profile.customFields.map(([label, value], fieldIndex) => ({
            label,
            value,
            sortOrder: fieldIndex,
          })),
        },
        profileTags: {
          create: profile.tags.map((tag) => ({
            tag: {
              connectOrCreate: {
                where: { slug: slugify(tag) },
                create: {
                  name: tag,
                  slug: slugify(tag),
                },
              },
            },
          })),
        },
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
