module.exports = {
  content: ["./index.html", "./src/**/*.{gleam,mjs}"],
  theme: {
    extend: {},
  },
  plugins: [
    //
    require("daisyui"),
  ],
  // daisyui: {
  //   themes: ["retro"],
  // },
};
