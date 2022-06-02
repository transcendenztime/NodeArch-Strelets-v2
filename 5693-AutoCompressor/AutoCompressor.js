// промисифицированный fs
const fsp = require("fs").promises;
const path = require("path");

const {createGzip} = require("zlib");
const {pipeline} = require("stream");
const {createReadStream, createWriteStream} = require("fs");
const {promisify} = require("util");
const pipe = promisify(pipeline);

// цвет текста в консоли
const FgRed = "\x1b[31m";
const FgGreen = "\x1b[32m";
const FgBlue = "\x1b[34m";
const FgMagenta = "\x1b[35m";
// сброс цвета текста в консоли
const Reset = "\x1b[0m";

// получаем путь к папке, переданный первым аргументом в скрипт
let pathToDir = process.argv[2];

async function do_gzip(input, output) {
  // console.log(`Начинаем сжимать файл ${input}`);
  console.log("Начинаем сжимать файл", FgBlue, input, Reset);

  const gzip = createGzip();
  const source = createReadStream(input);
  const destination = createWriteStream(output);
  await pipe(source, gzip, destination);

  console.log("Получен сжатый файл", FgRed, output, Reset);
}

const showAllFiles = async dir => {
  try {
    // читаем содержимое папки
    const objects = await fsp.readdir(dir);

    console.log("Сканируем папку", FgGreen, dir, Reset);
    // пройдем по всем объектам (файлам и папкам) в папке "dir"
    for (let object of objects) {
      const fullPathToObject = path.join(dir, object); // полный путь к файлу
      const stat = await fsp.stat(fullPathToObject);
      if (stat.isFile() && path.extname(fullPathToObject) !== ".gz") {
        // если обнаружили файл (исключаем уже сжатые файлы)
        console.log("Обнаружили файл", FgBlue, fullPathToObject, Reset);
        try {
          // если сжатый файл существует
          await fsp.access(`${fullPathToObject}.gz`);
          console.log("Сжатый файл", FgRed, `${fullPathToObject}.gz`, Reset, "существует");
          const originalFileStat = await fsp.stat(fullPathToObject);
          const originalFileChangeDate = originalFileStat.mtimeMs; // время последней модификации оригинального файла
          const gzFileStat = await fsp.stat(`${fullPathToObject}.gz`);
          const gzFileCreationDate = gzFileStat.mtimeMs; // время последней модификации сжатого файла
          // console.log(`Дата редактирования оригинального файла ${fullPathToObject} = ${originalFileChangeDate}`);
          // console.log(`Дата редактирования сжатого файла ${fullPathToObject}.gz = ${gzFileCreationDate}`);
          if (originalFileChangeDate > gzFileCreationDate) {
            // если сжатая версия этого файла устарела, пересоздадим ее
            // console.log("Обнаружили",FgMagenta, "устаревший", Reset, "сжатый файл", FgRed, `${fullPathToObject}.gz`, Reset, "Нужно пересоздать");
            console.log("Сжатый файл", FgRed, `${fullPathToObject}.gz`, FgMagenta, "устарел", Reset);
            await do_gzip(`${fullPathToObject}`, `${fullPathToObject}.gz`);
          }
        } catch (e) {
          // если сжатого файла нет, получим его
          await do_gzip(`${fullPathToObject}`, `${fullPathToObject}.gz`);
        }
      } else if (stat.isDirectory()) {
        // если обнаружили папку, сканируем ее (рукурсивно вызываем функцию сканирования)
        console.log("Обнаружили папку", FgGreen, fullPathToObject, Reset);
        await showAllFiles(fullPathToObject);
      }
    }
  } catch (e) {
    console.error("Произошла ошибка:", e.message);
    process.exitCode = 1;
  }
};

showAllFiles(pathToDir);
