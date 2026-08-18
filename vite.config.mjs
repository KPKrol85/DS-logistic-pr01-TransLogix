import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { defineConfig } from "vite";

const projectRoot = import.meta.dirname;

const maintainedPages = [
  "index.html",
  "services.html",
  "service.html",
  "fleet.html",
  "pricing.html",
  "contact.html",
  "thankyou.html",
  "privacy.html",
  "terms.html",
  "cookies.html",
  "404.html",
  "offline.html",
];

const staticDeploymentPaths = [
  "robots.txt",
  "sitemap.xml",
  "_headers",
  "_redirects",
  "assets/data",
  "assets/icons",
  "assets/img/fleet",
  "assets/img/screenshots",
  "assets/img/services",
  "assets/img/shortcuts",
  "assets/js/boot.js",
  "assets/js/theme-init.js",
];

function sharedPartialsPlugin() {
  let partials;

  return {
    name: "translogix-shared-partials",
    apply: "build",
    enforce: "pre",
    async buildStart() {
      const [header, footer] = await Promise.all([
        readFile(resolve(projectRoot, "partials/header.html"), "utf8"),
        readFile(resolve(projectRoot, "partials/footer.html"), "utf8"),
      ]);

      partials = {
        header: header.trimEnd(),
        footer: footer.trimEnd(),
      };
    },
    transformIndexHtml: {
      order: "pre",
      handler(html, context) {
        if (!maintainedPages.includes(basename(context.filename))) {
          return html;
        }

        const replacements = [
          ["{{> header}}", partials.header],
          ["{{> footer}}", partials.footer],
          ['<div data-partial="header"></div>', partials.header],
          ['<div data-partial="footer"></div>', partials.footer],
        ];

        let transformedHtml = html;
        for (const [marker, markup] of replacements) {
          transformedHtml = transformedHtml.replaceAll(marker, markup);
        }

        if (transformedHtml.includes('data-partial="header"') || transformedHtml.includes('data-partial="footer"')) {
          throw new Error(`Shared partial marker was not resolved in ${context.filename}`);
        }

        return transformedHtml;
      },
    },
  };
}

function serviceWorkerPlugin() {
  const assetPlaceholder = "const VITE_ASSET_URLS = [];";

  return {
    name: "translogix-service-worker",
    apply: "build",
    async writeBundle(outputOptions, bundle) {
      const outputRoot = resolve(projectRoot, outputOptions.dir || "dist");
      const generatedAssetUrls = Object.values(bundle)
        .filter((output) => output.fileName.endsWith(".css") || output.fileName.endsWith(".js"))
        .map((output) => `/${output.fileName}`)
        .sort();

      if (generatedAssetUrls.length === 0) {
        throw new Error("Vite did not emit any CSS or JavaScript assets for the service worker precache.");
      }

      const serviceWorkerSource = await readFile(resolve(projectRoot, "sw.js"), "utf8");
      if (!serviceWorkerSource.includes(assetPlaceholder)) {
        throw new Error("The service worker Vite asset placeholder is missing.");
      }

      const generatedAssetList = `const VITE_ASSET_URLS = ${JSON.stringify(generatedAssetUrls, null, 2)};`;
      const productionServiceWorker = serviceWorkerSource.replace(assetPlaceholder, generatedAssetList);

      await writeFile(resolve(outputRoot, "sw.js"), productionServiceWorker, "utf8");
    },
  };
}

function staticDeploymentFilesPlugin() {
  return {
    name: "translogix-static-deployment-files",
    apply: "build",
    async writeBundle(outputOptions) {
      const outputRoot = resolve(projectRoot, outputOptions.dir || "dist");

      await Promise.all(
        staticDeploymentPaths.map(async (relativePath) => {
          const sourcePath = resolve(projectRoot, relativePath);
          const destinationPath = resolve(outputRoot, relativePath);

          await mkdir(dirname(destinationPath), { recursive: true });
          await cp(sourcePath, destinationPath, { recursive: true });
        }),
      );
    },
  };
}

const pageInputs = Object.fromEntries(
  maintainedPages.map((page) => [page.replace(/\.html$/, ""), resolve(projectRoot, page)]),
);

export default defineConfig({
  base: "/",
  publicDir: false,
  plugins: [sharedPartialsPlugin(), staticDeploymentFilesPlugin(), serviceWorkerPlugin()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    manifest: true,
    rolldownOptions: {
      input: pageInputs,
    },
  },
});
