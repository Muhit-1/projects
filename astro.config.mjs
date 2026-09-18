import { defineConfig } from 'astro/config';

// GitHub Pages: the deploy workflow sets SITE and BASE (repo "projects" => BASE=/projects).
// Locally both are unset, so the site is served from "/".
export default defineConfig({
  site: process.env.SITE,
  base: process.env.BASE || '/',
});
