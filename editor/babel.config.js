module.exports = api => {
  api.cache(true);

  return {
    presets: [
      // ["@babel/env", {targets: "> 0.25%", useBuiltIns: "usage", corejs: "3.6.4"}],
      "@babel/preset-react",
      ["@babel/preset-typescript", {allExtensions: true, isTSX: true}],
    ],
    plugins: [
      // "@babel/plugin-syntax-dynamic-import",
      // "@babel/proposal-class-properties",
      // "@babel/proposal-object-rest-spread",
      // ["@babel/plugin-proposal-private-property-in-object", {loose: true}],
    ],
  };
};
