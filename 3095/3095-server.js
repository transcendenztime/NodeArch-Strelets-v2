const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const os = require("os");

const webserver = express();

// отдаем index.html как статику
webserver.use(express.static(path.join(__dirname, "public")));
webserver.use(bodyParser.json());
// webserver.use(express.urlencoded({extended: true}));

const port = 3095;
const logFN = path.join(__dirname, "_server.log");
const jsonFilesPath = "jsonFiles";
const variantsFilePath = path.join(jsonFilesPath, "variants.json");
const statsFilePath = path.join(jsonFilesPath, "_stats.json");

// пишет строку в файл лога и одновременно в консоль
const logLineSync = (logFilePath, logLine) => {
  const logDT = new Date();
  let time = logDT.toLocaleDateString() + " " + logDT.toLocaleTimeString();
  let fullLogLine = time + " " + logLine;

  console.log(fullLogLine); // выводим сообщение в консоль

  const logFd = fs.openSync(logFilePath, "a+"); // и это же сообщение добавляем в лог-файл
  fs.writeSync(logFd, fullLogLine + os.EOL); // os.EOL - это символ конца строки, он разный для разных ОС
  fs.closeSync(logFd);
};

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
  logLineSync(logFN, `[${port}] ` + "/variants service called");
  try {
    const variants = fs.readFileSync(variantsFilePath);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send(variants);
  } catch (e) {
    logLineSync(logFN, `[${port}] ` + "/variants service error 531");
    res.status(531).end();
  }
});

webserver.post("/stat", (req, res) => {
  logLineSync(logFN, `[${port}] ` + "/stats service called");
  try {
    let stat;
    // если файл статистики существует, прочитаем его
    if (fs.existsSync(statsFilePath)) {
      stat = fs.readFileSync(statsFilePath);
    } else {
      // если файл статистики не существует, создадим его базовый вариант (где у всех вариантов по 0 голосов)
      createInitialStatFile();
      stat = fs.readFileSync(statsFilePath);
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send(stat);
  } catch (e) {
    logLineSync(logFN, `[${port}] ` + "/stat service error 531");
    res.status(531).end();
  }
});

webserver.post("/vote", (req, res) => {
  logLineSync(logFN, `[${port}] ` + "/vote service called");
  try {
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

    const elem = fileContent.find(stat => {
      return stat.id === req.body.id;
    });

    if (elem) {
      elem.count = elem.count + 1;
      fs.writeFileSync(statsFilePath, JSON.stringify(fileContent));
      logLineSync(logFN, `[${port}] ` + "/vote service success");
      res.status(200).end();
    } else {
      logLineSync(logFN, `[${port}] ` + "/vote service error 530");
      res.status(530).end();
    }
  } catch (e) {
    logLineSync(logFN, `[${port}] ` + "/vote service error 531");
    res.status(531).end();
  }
});

webserver.listen(port, () => {
  console.log("web server running on port " + port);
});
