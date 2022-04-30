const express = require("express");
// const bodyParser = require('body-parser');
const fs = require("fs");
const path = require("path");
const os = require("os");

const webserver = express();

webserver.use(express.static(path.join(__dirname, "public")));
// webserver.use(bodyParser.json());
// webserver.use(bodyParser.urlencoded({extended:true}));
webserver.use(express.urlencoded({extended: true}));

const port = 3095;
const jsonFilesPath = "jsonFiles";

const variantsFilePath = path.join(jsonFilesPath, "variants.json");
const statFilePath = path.join(jsonFilesPath, "_stats.json");

createInitialStatFile = () => {
  const fileContent = [
    {
      id: 1,
      value: "Английский",
      count: 0,
    },
    {
      id: 2,
      value: "Немецкий",
      count: 0,
    },
    {
      id: 3,
      value: "JavaScript!!!",
      count: 0,
    },
    {
      id: 1,
      value: "Никакой(",
      count: 0,
    },
  ];

  fs.writeFileSync(statFilePath, JSON.stringify(fileContent));
};

webserver.get("/variants", (req, res) => {
  // const variants = fs.readFileSync(path.join(jsonFilesPath, "variants.json"), "utf8");
  // res.setHeader("Content-Type", "application/json");
  const variants = fs.readFileSync(variantsFilePath);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.send(variants);
});

webserver.post("/stat", (req, res) => {
  let stat;
  // если файл статистики существует
  if (fs.existsSync(statFilePath)) {
    stat = fs.readFileSync(statFilePath);
  } else {
    // если файл статистики не существует, создадим его базовый вариант
    createInitialStatFile();
    stat = fs.readFileSync(statFilePath);
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.send(stat);
});

webserver.listen(port, () => {
  console.log("web server running on port " + port);
});
