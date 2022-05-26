import fs from "fs";
import os from "os";

/**
 * @description асинхронная версия записи лога в файл и вывода в консоль
 * @param {String} logFilePath - путь к файлу лога
 * @param {String} logLine - строка для записи в лог
 * @returns {Promise}
 */
export const logLineAsync = (logFilePath, logLine) => {
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
export const openOrCreateFile = (filePath, initialData, logFN, port) => {
  let requests;
  // если файл с запросами существует, прочитаем его
  if (fs.existsSync(filePath)) {
    requests = fs.readFileSync(filePath);
  } else {
    // если файл с запросами не существует, создадим его базовый вариант (с пустым массивом)
    fs.writeFileSync(filePath, JSON.stringify(initialData));
    requests = fs.readFileSync(filePath);
    logLineAsync(logFN, `[${port}] ` + `empty ${filePath} file created`);
  }

  return requests;
};
