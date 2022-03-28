#!/usr/bin/env node

import { readdirSync, lstatSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import yargs from 'yargs';
import inquirer from 'inquirer';
import chalk from 'chalk';

const checkIsFile = (path) => {
  return lstatSync(path).isFile();
};

const getDirList = (dirPath) => {
  return readdirSync(dirPath)
    .map((item) => {
      const itemPath = path.join(dirPath, item);
      const isFile = checkIsFile(itemPath);
      return isFile
        ? { name: item, value: itemPath }
        : {
            name: chalk.bold(item),
            value: itemPath,
          };
    })
    .sort((a, b) => {
      if (a.name > b.name) {
        return 1;
      }
      if (a.name < b.name) {
        return -1;
      }
      return 0;
    });
};

const getAction = async () => {
  const { answer } = await inquirer.prompt([
    {
      name: 'answer',
      type: 'list',
      message: 'Выберете действие:',
      choices: [
        { name: 'Прочитать', value: 'read' },
        { name: 'Найти', value: 'find' },
      ],
    },
  ]);
  return answer;
};

const getSearchQuery = async () => {
  const { answer } = await inquirer.prompt([
    {
      name: 'answer',
      type: 'input',
      message: 'Введите искомую строку:',
    },
  ]);
  return answer;
};

const navigationToFile = async (path) => {
  if (checkIsFile(path)) return path;

  const dirList = await getDirList(path);

  if (dirList.length === 0) throw new Error('Директория пустая.');

  const { pathTo } = await inquirer.prompt([
    {
      name: 'pathTo',
      type: 'list',
      message: `Выберете файл или директорию:`,
      choices: dirList,
    },
  ]);

  return navigationToFile(pathTo);
};

const findString = (text, searchQuery) => {
  const listLines = text.split('\n');

  return listLines.map((line, index) => {
    if (line.search(searchQuery) >= 0) {
      const prefix = chalk.yellow(`Line-(${index + 1})\t`);
      const highlightedLine = line.replace(
        searchQuery,
        chalk.bold.red(searchQuery)
      );

      return prefix + highlightedLine;
    }
  });
};

const readFileOrFindInFile = async (path) => {
  const data = await readFile(path, 'utf-8');

  const action = await getAction();

  switch (action) {
    case 'find': {
      const searchQuery = await getSearchQuery();

      findString(data, searchQuery).forEach((line) => {
        if (line) console.log(line);
      });
      break;
    }
    default:
      console.log(data);
  }
};

const reader = async (path) => {
  const filePath = await navigationToFile(path);
  readFileOrFindInFile(filePath);
};

const options = yargs(process.argv.slice(2))
  .usage('Usage: -p <path>')
  .command('path', 'Path to a file or directory.')
  .alias('p', 'path').argv;

reader(options?.path ? options.path : process.cwd()).catch((error) =>
  console.log(error.message)
);
