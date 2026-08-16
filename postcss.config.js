module.exports = {
  plugins: [
    require("./scripts/postcss-plugins/postcss-import"),
    require("./scripts/postcss-plugins/autoprefixer"),
    require("cssnano")({
      preset: "default",
    }),
  ],
};
