const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
// const convert = require("xml-js");
const js2xmlparser = require("js2xmlparser");

const webserver = express();

// отдаем index.html как статику
webserver.use(express.static(path.join(__dirname, "public")));
webserver.use(bodyParser.json());
// webserver.use(express.urlencoded({extended: true}));

const port = 3595;
const logFN = path.join(__dirname, "_server.log");
const jsonFilesPath = "jsonFiles";
const variantsFilePath = path.join(jsonFilesPath, "variants.json");
const statsFilePath = path.join(jsonFilesPath, "_stats.json");
const UNKNOWN_ACCEPT_HEADER = "unknownAcceptHeader";

// информация для создания файла с нулевой статистикой
const initialStatContent = [
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

// если файл статистики существует, откроем его. Иначе создадим новый с нулевой статистикой.
openOrCreateStatFile = () => {
  let stat;
  // если файл статистики существует, прочитаем его
  if (fs.existsSync(statsFilePath)) {
    stat = fs.readFileSync(statsFilePath);
  } else {
    // если файл статистики не существует, создадим его базовый вариант (где у всех вариантов по 0 голосов)
    fs.writeFileSync(statsFilePath, JSON.stringify(initialStatContent));
    stat = fs.readFileSync(statsFilePath);
    logLineSync(logFN, `[${port}] ` + "empty _stats.json file created");
  }

  return stat;
};

// возвращает варианты для голосования
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

// сервис, который возвращает статистику
webserver.get("/stat", (req, res) => {
  logLineSync(logFN, `[${port}] ` + "/stats service called");
  try {
    const stat = openOrCreateStatFile();

    // создаем ETag при помощи пакета crypto
    const ETag = crypto.createHash("sha512").update(stat).digest("hex");
    const ifNoneMatch = req.header("If-None-Match");

    if (ifNoneMatch && ifNoneMatch === ETag) {
      logLineSync(logFN, `[${port}] ` + "отдаём 304 т.к. If-None-Match совпал с ETag");
      res.setHeader("ETag", ETag);
      res.status(304).end(); // в кэше браузера - годная версия, пусть её использует
    } else {
      res.setHeader("ETag", ETag);
      // кешируем запрос на 0 секунд
      res.setHeader("Cache-Control", "public, max-age=0"); // ответ может быть сохранён любым кэшем, в т.ч. кэшем браузера, на 0 секунд
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.send(stat);
    }

    // res.setHeader("Content-Type", "application/json; charset=utf-8");
    // res.setHeader("Cache-Control","public, max-age=0"); // ответ может быть сохранён любым кэшем, в т.ч. кэшем браузера, на 0 секунд
    // res.send(stat);
  } catch (e) {
    logLineSync(logFN, `[${port}] ` + "/stat service error 531");
    res.status(531).end();
  }
});

// сервис приема голоса
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

// запрос статистики в разных форматах
webserver.post("/info", (req, res) => {
  logLineSync(logFN, `[${port}] ` + "/info service called");
  try {
    const stat = openOrCreateStatFile();

    const acceptHeader = req.headers.accept;
    if (acceptHeader === "text/xml") {
      const statInJson = JSON.parse(stat);
      // const options = {compact: true, ignoreComment: true, spaces: 4, addParent: true};
      // const statInXml = convert.json2xml(statInJson, options);
      const statInXml = js2xmlparser.parse("stat", statInJson);
      res.send(statInXml);
    } else if (acceptHeader === "text/html") {
      const statInJson = JSON.parse(stat);
      let statistics = statInJson
        .map(st => `<div><span>${st.value}: </span><span style="font-weight: bold;">${st.count}</span></div>`)
        .join(`<br />`);
      res.send(statistics);
    } else if (acceptHeader === "application/json") {
      logLineSync(logFN, `[${port}] ` + "/info service success");
      res.send(stat);
    } else {
      // если с фронта пришел непредусмотренный нами заголовок Accept
      throw UNKNOWN_ACCEPT_HEADER;
    }
  } catch (e) {
    if (e === UNKNOWN_ACCEPT_HEADER) {
      logLineSync(logFN, `[${port}] ` + `/info service ${UNKNOWN_ACCEPT_HEADER} error`);
      res.status(532).end();
    } else {
      logLineSync(logFN, `[${port}] ` + "/info service error 531");
      res.status(531).end();
    }
  }
});

webserver.listen(port, () => {
  console.log("web server running on port " + port);
});
