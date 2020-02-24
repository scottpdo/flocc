const express = require("express");
const fs = require("fs");
const app = express();
const port = 3000;

app.use("/dist", express.static(__dirname + "/dist"));
app.use("/static", express.static(__dirname + "/static"));

app.get("*", (req, res) => {
  const header = fs.readFileSync(__dirname + "/partials/header.html");
  const footer = fs.readFileSync(__dirname + "/partials/footer.html");
  let path = req.path;
  if (path === "/") path = "/index";
  if (fs.existsSync(__dirname + "/pages" + path + ".html")) {
    res.send(
      header + fs.readFileSync(__dirname + "/pages" + path + ".html") + footer
    );
  } else {
    res.send(header + "404" + footer);
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
