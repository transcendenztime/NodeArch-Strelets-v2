const fs = require("fs");
const fsp = require("fs").promises;
const os = require("os");
const path = require("path");

const regExpForUrl = /^((https?):\/\/)?([a-z0-9]{1})((\.[a-z0-9-])|([a-z0-9-]))*\.([a-z]{2,6})(\/?)$/;
const regExpForUrl2 = /^(https?|ftp):\/\/[\w.%@]+(:?[?].*)?/;

const isURLValid = url => {
  return regExpForUrl2.test(url);
};

// асинхронная версия записи лога в файл и вывода в консоль
const logLineAsync = (logFilePath, logLine) => {
  return new Promise((resolve, reject) => {
    const logDT = new Date();
    let time = logDT.toLocaleDateString() + " " + logDT.toLocaleTimeString();
    let fullLogLine = time + " " + logLine;

    console.log(fullLogLine); // выводим сообщение в консоль

    fs.open(logFilePath, "a+", (err, logFd) => {
      if (err) reject(err);
      else
        fs.write(logFd, fullLogLine + os.EOL, err => {
          if (err) reject(err);
          else
            fs.close(logFd, err => {
              if (err) reject(err);
              else resolve();
            });
        });
    });
  });
};

/**
 * @description если файл с существует, откроем его. Иначе создадим пустой файл с данными из initialData
 * @param {String} filePath - путь к искомому файлу
 * @param {*} initialData - данные для инциаоизации нового файла
 * @param {String} logFN - путь к файлу лога
 * @param {Number} port - порт, на котором крутится сервер
 * @returns {*} - содержимое файла
 */
const openOrCreateFile = (filePath, initialData, logFN, port) => {
  let requests;
  // если файл с запросами существует, прочитаем его
  if (fs.existsSync(filePath)) {
    requests = fs.readFileSync(filePath);
  } else {
    // если файл с запросами не существует, создадим его базовый вариант
    fs.writeFileSync(filePath, JSON.stringify(initialData));
    requests = fs.readFileSync(filePath);
    logLineAsync(logFN, `[${port}] ` + `empty ${filePath} file created`);
  }

  return requests;
};

/**
 * @description если файл с существует, откроем его. Иначе создадим пустой файл с данными из initialData (асинхронная версия)
 * @param {String} filePath - путь к искомому файлу
 * @param {*} initialData - данные для инциаоизации нового файла
 * @param {String} logFN - путь к файлу лога
 * @param {Number} port - порт, на котором крутится сервер
 * @returns {*} - содержимое файла
 */
const openOrCreateFilePr = async (filePath, initialData, logFN, port) => {
  let files;
  try {
    // если файл с запросами существует, прочитаем его
    files = await fsp.readFile(filePath, "utf8");
  } catch (e) {
    await fsp.writeFile(filePath, JSON.stringify(initialData), "utf8");
    files = await fsp.readFile(filePath);
    logLineAsync(logFN, `[${port}] ` + `empty ${filePath} file created`);
  }

  return files;
};

// генерирует случайное имя файла (по-хорошему можно ещё проверить, а может такой уже существует, и перегенерить в этом случае)
const getRandomFileName = () => {
  return Math.random().toString(36).substring(2, 15);
};

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
};

module.exports = {
  isURLValid,
  logLineAsync,
  openOrCreateFile,
  openOrCreateFilePr,
  getRandomFileName,
  getRandomInt,
};
