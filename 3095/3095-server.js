const express = require("express");
const bodyParser = require('body-parser');
const fs = require("fs");
const path = require("path");
const os = require("os");

const webserver = express();

// отдаем index.html как статику
webserver.use(express.static(path.join(__dirname, "public")));
webserver.use(bodyParser.json());
// webserver.use(bodyParser.urlencoded({extended:true}));
// webserver.use(express.urlencoded({extended: true}));

const port = 3095;
const jsonFilesPath = "jsonFiles";
const variantsFilePath = path.join(jsonFilesPath, "variants.json");
const statsFilePath = path.join(jsonFilesPath, "_stats.json");

// функция нужна для того, чтобы на сервере создался файл с нулевой статисткой
createInitialStatFile = () => {
  const fileContent = [
    {
      id: "1",
      value: "Английский",
      count: 0,
    },
    {
      id: "2",
      value: "Немецкий",
      count: 0,
    },
    {
      id: "3",
      value: "JavaScript!!!",
      count: 0,
    },
    {
      id: "4",
      value: "Никакой(",
      count: 0,
    },
  ];

  fs.writeFileSync(statsFilePath, JSON.stringify(fileContent));
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
  if (fs.existsSync(statsFilePath)) {
    stat = fs.readFileSync(statsFilePath);
  } else {
    // если файл статистики не существует, создадим его базовый вариант (где у всех вариантов по 0 голосов)
    createInitialStatFile();
    stat = fs.readFileSync(statsFilePath);
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.send(stat);
});

webserver.post("/vote", (req, res) => {
  let fileContent = fs.readFileSync(statsFilePath, "utf8");
  fileContent = JSON.parse(fileContent);

  /* fileContent.forEach((stat) => {
    console.log(stat)
    if(stat.id === req.body.id) {
      stat.count = stat.count + 1;
    }
  });

  fs.writeFileSync(statsFilePath, JSON.stringify(fileContent));
  res.status(200).end();*/

  const elem = fileContent.find((stat) => {
    return stat.id === req.body.id;
  });

  if(elem) {
    elem.count = elem.count + 1;
    fs.writeFileSync(statsFilePath, JSON.stringify(fileContent));
    res.status(200).end();
  }

  res.status(530).end();
});

webserver.listen(port, () => {
  console.log("web server running on port " + port);
});
