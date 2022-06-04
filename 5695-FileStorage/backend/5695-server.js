const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const fsp = fs.promises;
const busboy = require("connect-busboy");

const {openOrCreateFilePr, logLineAsync, getRandomFileName} = require("../../utils/back-utils");

const webserver = express();

webserver.use(express.static(path.join(__dirname, "../frontend/public")));
// webserver.use(express.urlencoded({extended: true}));
webserver.use(bodyParser.json());

const port = 5695;
const logFN = path.join(__dirname, "_server.log");
const jsonFilesPath = "jsonFiles";
const uploadedFilePath = path.join(jsonFilesPath, "_uploaded-files.json");
const uploadFolder = path.join(__dirname, "uploads");

webserver.options("/get-files", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.send("");
});

// получение списка сохрненный файлов
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
    req.pipe(req.busboy); // перенаправляем поток приёма ответа в busboy

    req.busboy.on("field", (fieldname, val) => {
      // это событие возникает, когда в запросе обнаруживается "простое" поле, не файл
      reqFields[fieldname] = val;
    });

    req.busboy.on("file", (fieldname, file, filename, encoding, mimeType) => {
      // это событие возникает, когда в запросе обнаруживается файл
      // console.log("fieldname: ", fieldname)
      // console.log("file: ", file)
      // console.log("filename: ", filename)
      const tmpFileName = getRandomFileName();

      // const storedPFN = getRandomFileName(path.join(__dirname,"uploads"));

      const storedPFN = path.resolve(uploadFolder, tmpFileName);

      // const fileName = encodeURIComponent(filename);
      const fileName = filename;
      console.log("fileName: ", fileName);
      reqFiles[fieldname] = {originalFN: fileName, storedPFN: storedPFN, tmpFileName: tmpFileName};

      console.log("Uploading of", fileName, "started");

      const fsStream = fs.createWriteStream(storedPFN);

      file.pipe(fsStream);

      file.on("data", data => {
        totalDownloaded += data.length;
        console.log("loaded " + totalDownloaded + " bytes of " + totalRequestLength);
      });

      file.on("end", () => {
        console.log("file", fileName, "received");
      });
    });

    req.busboy.on("finish", async () => {
      // console.log('file saved, origin fileName='+reqFiles.photo.originalFN+', store fileName='+reqFiles.photo.storedPFN);
      console.log(
        "file saved, origin fileName=" +
          reqFiles.fileForUpload.originalFN +
          ", store path=" +
          reqFiles.fileForUpload.storedPFN +
          ", tmpFileName=" +
          reqFiles.fileForUpload.tmpFileName,
      );

      const file = {
        originalName: reqFiles.fileForUpload.originalFN,
        comment: reqFields.commentForFile,
        tmpName: reqFiles.fileForUpload.tmpFileName,
      };

      let files = await openOrCreateFilePr(uploadedFilePath, [], logFN, port);
      files = JSON.parse(files);

      const id = files.length ? files[files.length - 1].id + 1 : 1;

      // files.push({...file, id: files.length ? files[files.length - 1].id + 1 : 1});

      files.push({...file, id});

      // fs.writeFileSync(requestsFilePath, JSON.stringify(files));
      await fsp.writeFile(uploadedFilePath, JSON.stringify(files), "utf8");

      const body = JSON.stringify({
        // id: files[files.length - 1].id,
        id,
        files,
      });

      logLineAsync(
        logFN,
        `[${port}] file saved [ originalName: ${reqFiles.fileForUpload.originalFN} | tmpName: ${reqFiles.fileForUpload.tmpFileName} | id: ${id} ]`,
      );

      res.send(body);

      //      res.send("ok login="+reqFields.login);
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
        // requestId: request.requestId || requests.length,
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
    res.setHeader("Content-Disposition","attachment");
    res.sendFile(storedPFN);
  } else {
    logLineAsync(logFN, `[${port}] /download-file service error: Файл не найден`);
    res.status(500).send("Файл не найден");
  }
});

webserver.listen(port, () => {
  logLineAsync(logFN, "web server running on port " + port);
});
