const express = require("express");
// const bodyParser = require('body-parser');
const fs = require("fs");
const path = require("path");
const os = require("os");

const webserver = express();

webserver.use(express.static(path.join(__dirname, "public")));
// webserver.use(bodyParser.json());
// webserver.use(bodyParser.urlencoded({extended:true}));
webserver.use(express.urlencoded({extended:true}));

const port = 3095;
const jsonFilesPath = "jsonFiles";

webserver.get("/variants",(req, res) => {
  // const variants = fs.readFileSync(path.join(jsonFilesPath, "variants.json"), "utf8");
  // res.setHeader("Content-Type", "application/json");
  const variants = fs.readFileSync(path.join(jsonFilesPath, "variants.json"));
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.send(variants);
});

webserver.listen(port, () => {
  console.log("web server running on port " + port);
});