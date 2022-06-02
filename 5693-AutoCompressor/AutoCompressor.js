// промисифицированный fs
const fsp = require("fs").promises;
const path = require('path');

const { pipeline } = require('stream');
const {
  createReadStream,
  createWriteStream
} = require('fs');


// получаем путь к папке, переданный первым аргументом в скрипт
let pathToDir = process.argv[2];

const showAllFiles = async (dir) => {
// const stat = await fsp.stat(dir);
  // console.log(stat)
  // TODO проверять, папка ли это
  const objects = await fsp.readdir(dir);
// console.log(objects);
  // console.log(`Сканируем папку ${path.basename(dir)}`);
  console.log(`Сканируем папку ${(dir)}`);
  console.log("objects: ", objects);
  // пройдем по всем объектам (файлам и папкам) в папке
  for (let object of objects) {
    // console
    const fullPathToObject = path.join(dir, object); // полный путь к файлу
    const stat = await fsp.stat(fullPathToObject);
    if(stat.isFile()) {
      console.log(`Файл: ${path.basename(fullPathToObject)}`);
    } else if(stat.isDirectory()) {
      console.log(`Папка: ${path.basename(fullPathToObject)}`);
      await showAllFiles(fullPathToObject);
    }
  }
};


showAllFiles(pathToDir);