module.exports = {
  extends: ["react-app", "react-app/jest", "prettier"],
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "error",
    "import/no-anonymous-default-export": "off",
  },
};
