const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const fsp = fs.promises;
const busboy = require("connect-busboy");
const WebSocket = require("ws");

const {openOrCreateFilePr, logLineAsync, getRandomFileName, getRandomInt} = require("../../utils/back-utils");

const webserver = express();

webserver.use(express.static(path.join(__dirname, "../frontend/public")));
webserver.use(bodyParser.json());

const port = 5695;
const wsPort = 5696;
const logFN = path.join(__dirname, "_server.log");
const jsonFilesPath = "jsonFiles";
const uploadedFilePath = path.join(jsonFilesPath, "_uploaded-files.json");
const uploadFolder = path.join(__dirname, "uploads");

let clients = []; // здесь будут хэши вида { connection:, lastkeepalive:NNN }

const wsServer = new WebSocket.Server({port: wsPort}); // создаём сокет-сервер на порту 5696

wsServer.on("connection", connection => {
  // connection - это сокет-соединение сервера с клиентом

  connection.on("message", message => {
    if (message === "KEEP_ME_ALIVE") {
      clients.forEach(client => {
        if (client.connection === connection) {
          client.lastkeepalive = Date.now();
        }
      });
    } else if (message === "I_AM_DONE") {
      // клиент инициирует отключение
      clients.forEach(client => {
        if (client.connection === connection) {
          const clientMessage = {message: "CONNECTION_CLOSED"};
          client.connection.send(JSON.stringify(clientMessage));
          client.connection.terminate(); // если клиент уже давно не отчитывался что жив - закрываем соединение
          client.connection = null;
          logLineAsync(logFN, `[${wsPort}] client disconnected by request`);
        }
      });
      clients = clients.filter(client => client.connection); // оставляем в clients только живые соединения
    }
  });

  // по этому id будем искать клиента в массиве, чтобы отправилять информацию по загрузке файла
  const clientId = getRandomInt(1, 1000000);

  clients.push({connection: connection, clientId, lastkeepalive: Date.now()});
  logLineAsync(logFN, `[${wsPort}] new websocket connection established [ clientId: ${clientId}]`);
  const clientMessage = {message: "NEW_CLIENT_CONNECTED", clientId};
  connection.send(JSON.stringify(clientMessage));
});

webserver.options("/get-files", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.send("");
});

// получение списка сохраненных файлов
webserver.get("/get-files", async (req, res) => {
  logLineAsync(logFN, `[${port}] ` + "/get-files service called");
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const files = await openOrCreateFilePr(uploadedFilePath, [], logFN, port);
    res.send(files);
  } catch (e) {
    res.status(500).send(e.message);
    logLineAsync(logFN, `[${port}] /get-files service error: ${e.message}`);
  }
});

webserver.options("/upload-file", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.send("");
});

// загрузка файла
webserver.post("/upload-file", busboy(), (req, res) => {
  logLineAsync(logFN, `[${port}] ` + "/upload-file service called");
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const totalRequestLength = +req.headers["content-length"]; // общая длина запроса
    let totalDownloaded = 0; // сколько байт уже получено

    let reqFields = {}; // информация обо всех полях запроса, кроме файлов
    let reqFiles = {}; // информация обо всех файлах
    let client = null;
    req.pipe(req.busboy); // перенаправляем поток приёма ответа в busboy

    req.busboy.on("field", (fieldname, val) => {
      // это событие возникает, когда в запросе обнаруживается "простое" поле, не файл
      reqFields[fieldname] = val;
    });

    req.busboy.on("file", (fieldname, file, filename, encoding, mimeType) => {
      // это событие возникает, когда в запросе обнаруживается файл
      const tmpFileName = getRandomFileName();
      const storedPFN = path.resolve(uploadFolder, tmpFileName);

      client = clients.find(client => {
        return client.clientId === parseInt(reqFields.clientId);
      });

      const fileName = filename;
      reqFiles[fieldname] = {originalFN: fileName, storedPFN: storedPFN, tmpFileName: tmpFileName};

      logLineAsync(logFN, `[${port}] Uploading of ${fileName} started`);

      const fsStream = fs.createWriteStream(storedPFN);
      file.pipe(fsStream);

      file.on("data", data => {
        totalDownloaded += data.length;
        // console.log("loaded " + totalDownloaded + " bytes of " + totalRequestLength);
        // отправляем прогресс загрузки на фронт
        client.connection.send(
          JSON.stringify({message: "UPLOAD", percentage: (totalDownloaded / totalRequestLength) * 100}),
        );
      });

      file.on("end", () => {
        logLineAsync(logFN, `[${port}] file ${fileName} received`);
        client.connection.send(JSON.stringify({message: "UPLOAD", percentage: 100}));
      });
    });

    req.busboy.on("finish", async () => {
      const file = {
        originalName: reqFiles.fileForUpload.originalFN,
        comment: reqFields.commentForFile,
        tmpName: reqFiles.fileForUpload.tmpFileName,
      };

      let files = await openOrCreateFilePr(uploadedFilePath, [], logFN, port);
      files = JSON.parse(files);

      const id = files.length ? files[files.length - 1].id + 1 : 1;
      files.push({...file, id});

      await fsp.writeFile(uploadedFilePath, JSON.stringify(files), "utf8");

      const body = JSON.stringify({
        id,
        files,
      });

      logLineAsync(
        logFN,
        `[${port}] file saved [ original file name: ${reqFiles.fileForUpload.originalFN} | temp file name: ${reqFiles.fileForUpload.tmpFileName} | id: ${id} ]`,
      );

      // тут можно было бы закрыть websocket соединение, но его закрытие инициирует фронт после получения ответа
      // если же что-то пойдет не так, тогда мы прибьем клиента по таймеру максимум через несколько секунд

      res.send(body);
    });
  } catch (e) {
    logLineAsync(logFN, `[${port}] /upload-file service error: ${e.message}`);
    res.status(500).send(e.message);
  }
});

webserver.options("/delete-file", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.send("");
});

webserver.post("/delete-file", async (req, res) => {
  logLineAsync(logFN, `[${port}] ` + "/delete-file service called");
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const file = req.body;
    let files = await fsp.readFile(uploadedFilePath, "utf8");
    files = JSON.parse(files);

    const indexToDelete = files.findIndex(item => {
      return item.id === file.id;
    });

    if (indexToDelete !== -1) {
      // удаляем файл
      const storedPFN = path.resolve(uploadFolder, files[indexToDelete].tmpName);
      await fsp.unlink(storedPFN);
      files.splice(indexToDelete, 1);
      await fsp.writeFile(uploadedFilePath, JSON.stringify(files), "utf8");

      const body = JSON.stringify({
        id: file.id,
      });

      res.send(body);
    } else {
      logLineAsync(logFN, `[${port}] ` + "/delete-file service error: wrong id");
      res.status(510).send(`Не найден файл с id=${file.requestId}`);
    }
  } catch (e) {
    logLineAsync(logFN, `[${port}] /delete-file service error: ${e.message}`);
    res.status(500).send(e.message);
  }
});

webserver.options("/download-file", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.send("");
});

webserver.post("/download-file", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const file = req.body;

  let files = await fsp.readFile(uploadedFilePath, "utf8");
  files = JSON.parse(files);

  const fileToDownload = files.find(item => {
    return item.id === file.id;
  });
  const storedPFN = path.resolve(uploadFolder, fileToDownload.tmpName);
  if (fileToDownload) {
    logLineAsync(logFN, `[${port}] /download-file service [Файл ${fileToDownload.originalName} скачан ]`);
    res.setHeader("Content-Disposition", "attachment");
    res.sendFile(storedPFN);
  } else {
    logLineAsync(logFN, `[${port}] /download-file service error: Файл не найден`);
    res.status(500).send("Файл не найден");
  }
});

setInterval(() => {
  clients.forEach(client => {
    if (Date.now() - client.lastkeepalive > 8000) {
      client.connection.terminate(); // если клиент уже давно не отчитывался что жив - закрываем соединение
      client.connection = null;
      logLineAsync(logFN, `[${wsPort}] client disconnected by timeout`);
    }
  });
  clients = clients.filter(client => client.connection); // оставляем в clients только живые соединения
}, 3000);

webserver.listen(port, () => {
  logLineAsync(logFN, "web server running on port " + port);
});
