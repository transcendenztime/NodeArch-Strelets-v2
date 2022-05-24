// const fs = require("fs");
// const os = require("os");

import fs from "fs";
import os from "os";

const regExpForUrl = /^((https?):\/\/)?([a-z0-9]{1})((\.[a-z0-9-])|([a-z0-9-]))*\.([a-z]{2,6})(\/?)$/;
const regExpForUrl2 = /^(https?|ftp):\/\/[\w.%@]+(:?[?].*)?/;

export const isURLValid = url => {
  return regExpForUrl2.test(url);
};

// асинхронная версия записи лога в файл и вывода в консоль
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

/* module.exports = {
  isURLValid,
  logLineAsync,
};*/
