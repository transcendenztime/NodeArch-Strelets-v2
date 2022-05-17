const express = require("express");
const path = require("path");

const webserver = express();

webserver.use(express.static(path.join(__dirname, "../frontend/public")));

const port = 4095;

webserver.options('/test', (req, res) => {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  res.send("");
});

webserver.get("/test", (req, res) => {
  console.log("/test service called");
  res.setHeader("Access-Control-Allow-Origin","*");
  res.send("test service answer");
});

webserver.listen(port, () => {
  console.log("web server running on port " + port);
});