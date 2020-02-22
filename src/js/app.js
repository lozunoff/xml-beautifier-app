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

// Массив для хранения исходного xml в виде отдельных строк
let inputArray = [];
// Счетчик для отслеживания кол-ва показанных в input строк
let inputRowCounter = 0;
// Массив для хранения обработанного xml в виде отдельных строк
let outputArray = [];
// Счетчик для отслеживания кол-ва показанных в output строк
let outputRowCounter = 0;

// Функция для получения настроек из локального хранилища браузера
const getOptionsFromStorage = () => {
  // Достаем из хранилища настройки, если они существуют
  if (window.localStorage.options) {
    return JSON.parse(window.localStorage.options);
  }

  // Возвращаем значения по умолчанию, если настроек в хранилище нет
  return {
    tabSize: 4,
    endLine: '\r\n',
    useSelfClosingTags: false,
    delComments: false,
  };
};

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
        inputArray = content.split(/(\r\n|\n|\r)+/);
        // Если после разбивки получается меньше 1000 строк
        if (inputArray.length < 1000) {
          // Выводим в input весь полученный текст
          input.innerText = content;
          // Увеличиваем счетчик до максимального значения
          inputRowCounter = inputArray.length;
        } else {
          // Если строк больше 1000 - выводим только первую 1000
          const options = getOptionsFromStorage();
          for (let row = 0; row < 1000; row += 1) {
            input.insertAdjacentText('beforeEnd', `${inputArray[row]}${options.endLine}`);
            inputRowCounter += 1;
          }
        }
        // Выводим сообщение об успешной загрузке файла
        status.innerText = 'Uploaded successfully!';
      } else {
        // Если файл прочитать не удалось - выводим сообщение о провале
        status.innerText = 'Upload failed!';
      }
    });
  }

  // Сбрасываем фокус с кнопки "Upload"
  btnUpload.blur();
});

// Обрабатываем нажатие кнопки "Beautify"
btnBeautify.addEventListener('click', () => {
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
      const options = getOptionsFromStorage();
      // Склеиваем строки из inputArray в единный текст и передаем в beautifier
      // После обработки получаем массив новых строк
      outputArray = beautify(inputArray.join(options.endLine), options);

      // Считаем кол-во строк в полученном результате
      if (outputArray.length < 1000) {
        // Если после обработки полуилось менее 1000 строк - выводим в output весь текст
        output.insertAdjacentText('beforeEnd', outputArray.join(''));
        // Увеличиваем счетчик до максимального значения
        outputRowCounter = outputArray.length;
      } else {
        // Если после обработки полуилось более 1000 строк - выводим только первую 1000
        for (let row = 0; row < 1000; row += 1) {
          output.insertAdjacentText('beforeEnd', outputArray[outputRowCounter]);
          outputRowCounter += 1;
        }
      }
      // Выводим сообщение об успешном преобразовании
      status.innerText = 'Successfully!';
    } catch (e) {
      // Если преобразование не удалось - выводим сообщение о провале
      status.innerText = e.message;
    }
  }, 100);

  // Сбрасываем фокус с кнопки "Beautify"
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
    // Запоминаем путь для нового файла
    const { filePath } = result;

    // Пытаемся сохранить исправленный контент в файл
    await fs.writeFile(filePath, outputArray.join(''), (err) => {
      if (!err) {
        // Выводим сообщение об успешном сохранении
        status.innerText = 'Saved successfully!';
      } else {
        // Если сохранение не удалось - выводим сообщение о провале
        status.innerText = 'Save failed!';
      }
    });
  }

  // Сбрасываем фокус с кнопки "Save As..."
  btnSaveAs.blur();
});

// Обрабатываем нажатие на заголовок программы
title.addEventListener('click', () => {
  // Переходим в репозиторий приложения
  shell.openExternal('https://github.com/lozunoff/xml-beautifier-app');
});

// Обрабатываем нажатие по названию лицензии
licenseLink.addEventListener('click', () => {
  // Переходим в репозиторий приложения на страницу с текстом лицензии
  shell.openExternal('https://github.com/lozunoff/xml-beautifier-app/blob/master/LICENSE');
});

// Обрабатываем скролл в input
input.addEventListener('scroll', () => {
  // Проверяем, что в input выведена только часть строк
  if (inputRowCounter < inputArray.length) {
    const options = getOptionsFromStorage();
    // Добавляем при прокрутке новые строки
    input.insertAdjacentText('beforeEnd', `${inputArray[inputRowCounter]}${options.endLine}`);
    // Увеличиваем счетчик
    inputRowCounter += 1;
  }
});

// Обрабатываем скролл в output
output.addEventListener('scroll', () => {
  // Проверяем, что в output выведена только часть строк
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
