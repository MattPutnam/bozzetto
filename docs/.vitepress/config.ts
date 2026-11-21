import { existsSync, readFileSync } from "node:fs";
import { defineConfig, type DefaultTheme } from "vitepress";

// Made by TypeDoc (`npm run docs:api`) before the site builds.
const apiSidebarFile = new URL("../reference/api/typedoc-sidebar.json", import.meta.url);
const apiSidebar: DefaultTheme.SidebarItem[] = existsSync(apiSidebarFile)
  ? JSON.parse(readFileSync(apiSidebarFile, "utf8"))
  : [];

const repo = "https://github.com/MattPutnam/bozzetto";
const site = "https://mattputnam.github.io/bozzetto";

export default defineConfig({
  title: "Bozzetto",
  description:
    "Seeded placeholder pictures as tiny SVGs: landscapes, art, people, animals, food and still lifes, in any palette.",
  base: "/bozzetto/",
  cleanUrls: true,
  lastUpdated: false,
  head: [["link", { rel: "icon", type: "image/svg+xml", href: "/bozzetto/logo.svg" }]],
  markdown: { theme: { light: "github-light", dark: "github-dark" } },
  // <bozzetto-img> is a custom element, not a Vue component.
  vue: { template: { compilerOptions: { isCustomElement: tag => tag === "bozzetto-img" } } },
  themeConfig: {
    logo: "/logo.svg",
    nav: [
      { text: "Guide", link: "/guide/", activeMatch: "/guide/" },
      { text: "Kinds", link: "/guide/kinds" },
      { text: "API", link: "/reference/", activeMatch: "/reference/" },
      { text: "Gallery", link: `${site}/demo/`, target: "_self" },
      { text: "Palette picker", link: `${site}/demo/picker.html`, target: "_self" },
    ],
    sidebar: {
      "/reference/": [{ text: "API reference", items: [{ text: "Overview", link: "/reference/" }] }, ...apiSidebar],
      "/": [
        {
          text: "Introduction",
          items: [
            { text: "What is Bozzetto?", link: "/guide/" },
            { text: "Getting started", link: "/guide/getting-started" },
          ],
        },
        {
          text: "Pictures",
          items: [
            { text: "Kinds and categories", link: "/guide/kinds" },
            { text: "Filling a gallery", link: "/guide/galleries" },
            { text: "Alt text, focus and color", link: "/guide/pictures" },
            { text: "Avatars", link: "/guide/avatars" },
          ],
        },
        {
          text: "Color",
          items: [
            { text: "Palettes and adjustments", link: "/guide/colors" },
            { text: "Making a palette", link: "/guide/making-palettes" },
          ],
        },
        {
          text: "More",
          items: [
            { text: "Command line", link: "/guide/cli" },
            { text: "PNG, WebP and JPEG", link: "/guide/images" },
            { text: "Your own kinds", link: "/guide/custom-kinds" },
            { text: "React, Vue and web components", link: "/guide/components" },
            { text: "Using it with…", link: "/guide/recipes" },
            { text: "API reference", link: "/reference/" },
            { text: "Gallery", link: `${site}/demo/`, target: "_self" },
            { text: "Palette picker", link: `${site}/demo/picker.html`, target: "_self" },
          ],
        },
      ],
    },
    socialLinks: [{ icon: "github", link: repo }],
    search: { provider: "local" },
    outline: { level: [2, 3] },
    editLink: { pattern: `${repo}/edit/main/docs/:path`, text: "Edit this page on GitHub" },
    footer: { message: "MIT licensed. A bozzetto is a painter's small preliminary sketch." },
  },
});
