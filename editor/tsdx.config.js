const url = require("@rollup/plugin-url");
const svgr = require("@svgr/rollup").default;
const postcss = require("rollup-plugin-postcss");
const dotenv = require("rollup-plugin-dotenv").default;

module.exports = {
  rollup(config) {
    config.input = "./src/lib.tsx";
    config.inlineDynamicImports = true;
    config.plugins = [
      dotenv(),
      postcss({
        extract: true,
        use: ["sass"],
      }),
      url({
        limit: Infinity,
      }),
      svgr({
        ref: true,
        memo: true,
        svgoConfig: {
          // plugins: [{removeViewBox: false}, {removeAttrs: {attrs: "g:(stroke|fill):((?!^none$).)*"}}],
          plugins: [{removeViewBox: false}],
        },
      }),
      ...config.plugins,
    ];

    return config;
  },
};
