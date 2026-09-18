import { z } from 'zod';
import site from '../data/site.json';
import projectsRaw from '../data/projects.json';

const Img = z.object({
  src: z.string().min(1),
  alt: z.string().default(''),
  caption: z.string().optional(),
});

const Project = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'slug: lowercase letters, numbers and dashes only'),
  name: z.string().min(1),
  tagline: z.string().default(''),
  description: z.string().min(1),
  features: z.array(z.string()).default([]),
  year: z.string().optional(),
  role: z.string().optional(),
  stack: z.array(z.string()).default([]),
  links: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
  hero: Img,
  gallery: z.array(Img).max(4, 'gallery: at most 4 images fit the page').default([]),
});

const parsed = z.array(Project).safeParse(projectsRaw);
if (!parsed.success) {
  const msg = parsed.error.issues
    .map((i) => `  projects.json → [${i.path.join(' → ')}]: ${i.message}`)
    .join('\n');
  throw new Error(`Invalid src/data/projects.json:\n${msg}`);
}
const slugs = parsed.data.map((p) => p.slug);
const dup = slugs.find((s, i) => slugs.indexOf(s) !== i);
if (dup) throw new Error(`Invalid src/data/projects.json: duplicate slug "${dup}"`);

export const projects = parsed.data;
export type Project = z.infer<typeof Project>;
export { site };

/** "projects/x/hero.gif" → "<base>/assets/projects/x/hero.gif" (full URLs pass through). */
export function asset(p?: string | null): string | null {
  if (!p) return null;
  if (/^(https?:)?\/\//.test(p) || p.startsWith('data:')) return p;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/assets/${p.replace(/^\/+/, '')}`;
}

/* ---- scroll choreography -------------------------------------------------
   Scroll positions are in "units" (1 unit = 6.6vh, see --u in book.css). The intro
   (doors, camera push, book flying in, cover opening) is fixed at units 0–49 and
   never depends on the project count. Page turns then run one after another. */
const COVER = { a: 34, b: 49 };
const FIRST_TURN = 52;
const TURN_STEP = 15; // units per page turn (≈ one screenful of scrolling)
const TURN_LEN = 14;

export interface Leaf {
  k: number; // 0 = cover, 1..L = pages
  a: number;
  b: number;
  tz0: number;
  tz1: number;
  z0: number;
  z1: number;
  end: number;
}

export function buildTimeline(projectCount: number) {
  // leaves: 1 index page + 1 per project + the back cover. Each leaf's front is a right-hand page,
  // its back the next left-hand page (the last leaf's back is the outside of the back cover).
  const L = projectCount + 2;
  const step = 0.05; // tiny fan; stacking order on the left comes from --tz1, so pages can lie almost flat
  const leaves: Leaf[] = [];
  for (let k = 0; k <= L; k++) {
    const a = k === 0 ? COVER.a : FIRST_TURN + TURN_STEP * (k - 1);
    const b = k === 0 ? COVER.b : a + (k === L ? TURN_LEN - 1 : TURN_LEN);
    leaves.push({
      k,
      a,
      b,
      tz0: L + 3 - k, // right stack: page 1 highest
      tz1: 1 + k, // left stack: last page turned is highest
      z0: 10 * (L + 1 - k),
      z1: 11 + k,
      end: -179.6 + step * k,
    });
  }
  const last = leaves[L];
  // the board behind the right pages fades as the back cover swings over; then the shut book slides to the centre
  const back = { a: last.a + 6, b: last.b };
  const close = { a: last.b - 5, b: last.b + 4 };
  const total = close.b + 4;
  return { L, leaves, total, back, close };
}
