const { remote } = require('electron');
const fs = require('fs');
const path = require('path');
const beautify = require('./beautifier');

const { dialog, shell } = remote;

// Получаем элементы интерфейса, с которыми будем взаимодействовать
const btnUpload = document.getElementById('btnUpload');
const btnBeautify = document.getElementById('btnBeautify');
const btnSettings = document.getElementById('btnSettings');
const btnSaveAs = document.getElementById('btnSaveAs');
const input = document.getElementById('input');
const output = document.getElementById('output');
const title = document.getElementById('title');
const licenseLink = document.getElementById('licenseLink');
const status = document.getElementById('status');

// Массив для хранения входящего текста в виде строк
let inputArray = [];
// Счетчик для отслеживания кол-ва выведеных строк
let inputRowCounter = 0;
// Массив для хранения обработанного текста в виде строк
let outputArray = [];
// Счетчик для отслеживания кол-ва выведеных строк
let outputRowCounter = 0;

// Обрабатываем нажатие кнопки "Upload"
btnUpload.addEventListener('click', async () => {
  // Открываем диалоговое окно выбора файла
  const result = await dialog.showOpenDialog(remote.getCurrentWindow(), {
    properties: [
      'openFile',
    ],
    filters: [
      { name: 'XML', extensions: ['xml'] },
    ],
  });

  // Проверяем, что в диалоговом окне не нажата кнопка "Отмена"
  if (result.canceled === false) {
    // Выводим сообщение с просьбой подождать
    status.innerText = 'Please, wait...';
    // Получаем путь к выбранному файлу
    const filePath = result.filePaths[0];

    // Получаем содержимое файла
    await fs.readFile(filePath, 'utf-8', (err, content) => {
      if (!err) {
        // Очищаем input от имеющихся данных
        input.innerText = '';
        // Обнуляем счетчик выведенных строк
        inputRowCounter = 0;
        // Очищаем массив со строками
        inputArray.length = 0;
        // Сбрасываем имеющийся скролл
        input.scrollTop = 0;
        input.scrollLeft = 0;
        // Разбиваем содержимое файла на массив строк
        inputArray = content.split(/\r?\n/);
        // Если после разбивки получается меньше 1000 строк
        if (inputArray.length < 1000) {
          // Выводим в input весь полученный текст
          input.innerText = content;
          // Увеличиваем счетчик до максимального значения
          inputRowCounter = inputArray.length;
        } else {
          // Если после разбивки получилось больше 1000 строк
          for (let row = 0; row < 1000; row += 1) {
            // Выводим только первую 1000
            input.insertAdjacentText('beforeEnd', `${inputArray[row]}\r\n`);
            inputRowCounter += 1;
          }
        }
        // Выводим сообщение об успешной загрузке
        status.innerText = 'Uploaded successfully!';
      } else {
        // Иначе - выводим сообщение о провале
        status.innerText = 'Upload failed!';
      }
    });
  }

  btnUpload.blur();
});

// Обрабатываем нажатие кнопки "Beautify"
btnBeautify.addEventListener('click', async () => {
  // Выводим сообщение с просьбой подождать
  status.innerText = 'Please, wait...';
  // Очищаем output от имеющихся данных
  output.innerText = '';
  // Обнуляем счетчик выведенных в output строк
  outputRowCounter = 0;
  // Очищаем массив строк
  outputArray.length = 0;
  // Сбрасываем имеющийся скролл
  output.scrollTop = 0;
  output.scrollLeft = 0;

  setTimeout(() => {
    try {
      // Склеиваем массив строк и передаем в beautifier, в ответ получаем новый массив строк
      outputArray = beautify(inputArray.join('\r\n'));
      // Проверяем кол-во строк в обработанном результате
      if (outputArray.length < 1000) {
        // Если на выходе получили менее 1000 строк, выводим в output весь текст
        output.insertAdjacentText('beforeEnd', outputArray.join(''));
        // Увеличиваем счетчик до максимального значения
        outputRowCounter = outputArray.length;
      } else {
        // Если на выходе получили более 1000 строк, выводим только первую 1000
        for (let row = 0; row < 1000; row += 1) {
          output.insertAdjacentText('beforeEnd', outputArray[outputRowCounter]);
          outputRowCounter += 1;
        }
      }
      // Выводим сообщение об успешном преобразовании
      status.innerText = 'Successfully!';
    } catch (e) {
      // Иначе - выводим текст ошибки
      status.innerText = e.message;
    }
  }, 100);

  btnBeautify.blur();
});

// Обрабатываем нажатие кнопки "Settings"
btnSettings.addEventListener('click', () => {
  // Создаем окно с настройками
  const settingsWindow = new remote.BrowserWindow({
    width: 400,
    height: 300,
    parent: remote.getCurrentWindow(),
    modal: true,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
      devTools: false,
    },
  });

  // Загружаем в окно settings.html
  settingsWindow.loadFile(path.join(__dirname, '../html/settings.html'));

  // Скрываем стандартное меню окна
  settingsWindow.removeMenu();

  // Сбрасываем фокус с кнопки "Settings"
  btnSettings.blur();
});

// Обрабатываем нажатие кнопки "Save As..."
btnSaveAs.addEventListener('click', async () => {
  // Открываем диалоговое окно сохранения файла
  const result = await dialog.showSaveDialog(remote.getCurrentWindow(), {
    filters: [
      { name: 'XML', extensions: ['xml'] },
    ],
  });

  // Проверяем, что в диалоговом окне не нажата кнопка "Отмена"
  if (result.canceled === false) {
    // Выводим сообщение с просьбой подождать
    status.innerText = 'Please, wait...';
    // Запоминаем путь для сохранения
    const { filePath } = result;

    // Пытаемся сохранить исправленный контент в файл
    await fs.writeFile(filePath, outputArray.join(''), (err) => {
      if (!err) {
        // Выводим сообщение об успешном сохранении
        status.innerText = 'Saved successfully!';
      } else {
        // Иначе - выводим сообщение о провале
        status.innerText = 'Save failed!';
      }
    });
  }

  btnSaveAs.blur();
});

// При нажатии по заголовку программы переходим в репо
title.addEventListener('click', () => {
  shell.openExternal('https://github.com/lozunoff/xml-beautifier-app');
});

// При нажатии по типу лицензии переходим в описание лицензии в репо
licenseLink.addEventListener('click', () => {
  shell.openExternal('https://github.com/lozunoff/xml-beautifier-app/blob/master/LICENSE');
});

// Обрабатываем скролл в input
input.addEventListener('scroll', () => {
  // Проверяем, что счетчик выведенных в строк меньше общего кол-ва строк
  if (inputRowCounter < inputArray.length) {
    // Добавляем при прокрутке новые строки
    input.insertAdjacentText('beforeEnd', `${inputArray[inputRowCounter]}\r\n`);
    // Увеличиваем счетчик
    inputRowCounter += 1;
  }
});

// Обрабатываем скролл в output
output.addEventListener('scroll', () => {
  // Проверяем, что счетчик выведенных в строк меньше общего кол-ва строк
  if (outputRowCounter < outputArray.length) {
    // Добавляем при прокрутке новые строки
    output.insertAdjacentText('beforeEnd', outputArray[outputRowCounter]);
    // Увеличиваем счетчик
    outputRowCounter += 1;
  }
});

// Запрещаем вырезать текст из output
output.addEventListener('cut', (e) => {
  e.preventDefault();
  return false;
});

// Запрещаем вставку текста в output
output.addEventListener('paste', (e) => {
  e.preventDefault();
  return false;
});

// Запрещаем ввод текста в output
output.addEventListener('keydown', (e) => {
  if (!e.ctrlKey) {
    e.preventDefault();
    return false;
  }

  return true;
});
