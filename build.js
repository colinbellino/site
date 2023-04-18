const fs = require("fs");
const uglify = require("uglify-js");

const jsFiles = [
  "./public/js/breakout_loader",
  "./public/js/breakout_game",
  "./public/js/breakout_platform_browser",
  "./public/js/math",
];
const htmlFiles = [
  "./index",
  "./games",
  "./web",
  "./changelog",
  "./breakout",
];

jsFiles.forEach((file) => {
  fs.readFile(`${file}.mjs`, "utf8", function (error, data) {
    if (error)
      return console.log(error);

    const { code } = uglify.minify(data, { compress: true, mangle: true });
    const output = code.replace(/.mjs/g, ".min.mjs");

    fs.writeFile(`${file}.min.mjs`, output, "utf8", function (error) {
      if (error)
        return console.log(error);
    });
  });
});

htmlFiles.forEach((file) => {
  fs.readFile(`${file}.html`, "utf8", function (error, data) {
    if (error)
      return console.log(error);

    const output = data.replace(/.mjs/g, ".min.mjs");
    fs.writeFile(`${file}.min.html`, output, "utf8", function (error) {
      if (error)
        return console.log(error);
    });
  });
});
