const { dialog, shell } = require('electron').remote; // eslint-disable-line
const fs = require('fs');
const beautify = require('./beautifier');

// Получаем элементы интерфейса, с которыми будем взаимодействовать
const btnUpload = document.getElementById('btnUpload');
const btnBeautify = document.getElementById('btnBeautify');
const btnSaveAs = document.getElementById('btnSaveAs');
const input = document.getElementById('input');
const output = document.getElementById('output');
const title = document.getElementById('title');
const mit = document.getElementById('mit');

// Функция, блокирующая нажатие элементов
const disableElements = (...buttons) => {
  buttons.forEach((btn) => btn.setAttribute('disabled', 'disabled'));
};

// Функция, разблокирующая нажатие элементов
const enableElements = (...buttons) => {
  buttons.forEach((btn) => btn.removeAttribute('disabled'));
};

// Функция, меняющая классы у элементов
const changeClasses = (element, classesToDelete = [], classesToAdd = []) => {
  classesToDelete.forEach((item) => {
    if (element.classList.contains(item)) {
      element.classList.remove(item);
    }
  });

  classesToAdd.forEach((item) => {
    if (!element.classList.contains(item)) {
      element.classList.add(item);
    }
  });
};

// Обрабатываем нажатие кнопки "Upload"
btnUpload.addEventListener('click', async () => {
  // Временно блокируем нажатие элементов
  disableElements(btnUpload, btnBeautify, btnSaveAs, input);

  // Открываем диалоговое окно выбора файла
  const result = await dialog.showOpenDialog({
    properties: [
      'openFile',
    ],
    filters: [
      { name: 'XML', extensions: ['xml'] },
    ],
  });

  // Проверяем, что в диалоговом окне не нажата кнопка "Отмена"
  if (result.canceled === false) {
    // Получаем путь к выбранному файлу
    const filePath = await result.filePaths[0];

    // Получаем содержимое файла
    await fs.readFile(filePath, 'utf-8', (err, content) => {
      if (!err) {
        // Если ошибок нет - помещаем контент в первый <textarea>
        input.value = content;
        // Сигнализируем цветом кнопки об успешности операции
        changeClasses(btnUpload, ['btn-warning', 'btn-danger'], ['btn-success']);
      } else {
        // Если файл прочитать не удалось - сигнализируем цветом кнопки о провале
        changeClasses(btnUpload, ['btn-warning', 'btn-success'], ['btn-danger']);
      }

      setTimeout(() => {
        // По истечению таймаута сбрасываем стили кнопки на дефолтные
        changeClasses(btnUpload, ['btn-danger', 'btn-success'], ['btn-warning']);
        // Снимаем блокировку с элементов
        enableElements(btnUpload, btnBeautify, btnSaveAs, input);
      }, 200);
    });
  } else {
    // Если нажата отмена - то снимаем блокировку с элементов
    enableElements(btnUpload, btnBeautify, btnSaveAs, input);
  }
});

// Обрабатываем нажатие кнопки "Upload"
btnBeautify.addEventListener('click', () => {
  // Блокируем кнопку для повторного нажатия
  disableElements(btnBeautify);

  // Очищаем output при каждом нажатии
  output.value = '';

  // Если преобразование прошло без проблем
  try {
    // Помещаем преобразованный контент во второй <textarea>
    output.value = beautify(input.value);
    // Сигнализируем цветом кнопки об успешности операции
    changeClasses(btnBeautify, ['btn-warning', 'btn-danger'], ['btn-success']);
  } catch (e) {
    // Если возникли пробелмы - сигнализируем цветом кнопки о провале
    changeClasses(btnBeautify, ['btn-warning', 'btn-success'], ['btn-danger']);
    // Парсим ответ, находим ошибку и помещаем ее в <textarea> вместо контента
    output.value = e;
  }

  setTimeout(() => {
    // По истечению таймаута сбрасываем стили кнопки на дефолтные
    changeClasses(btnBeautify, ['btn-danger', 'btn-success'], ['btn-warning']);
    // Разрешаем повторное нажатие кнопки
    enableElements(btnBeautify);
  }, 200);
});

// Обрабатываем нажатие кнопки "Save As..."
btnSaveAs.addEventListener('click', async () => {
  // Временно блокируем нажатие элементов
  disableElements(btnUpload, btnBeautify, btnSaveAs);

  // Открываем диалоговое окно сохранения файла
  const result = await dialog.showSaveDialog({
    filters: [
      { name: 'XML', extensions: ['xml'] },
    ],
  });

  // Проверяем, что в диалоговом окне не нажата кнопка "Отмена"
  if (result.canceled === false) {
    // Запоминаем путь для сохранения
    const filePath = await result.filePath;

    // Пытаемся сохранить исправленный контент в файл
    await fs.writeFile(filePath, output.value, (err) => {
      if (!err) {
        // Если ошибок нет - сигнализируем цветом кнопки об успешности операции
        changeClasses(btnSaveAs, ['btn-warning', 'btn-danger'], ['btn-success']);
      } else {
        // Если возникли пробелмы - сигнализируем цветом кнопки о провале
        changeClasses(btnSaveAs, ['btn-warning', 'btn-success'], ['btn-danger']);
      }

      setTimeout(() => {
        // По истечению таймаута сбрасываем стили кнопки на дефолтные
        changeClasses(btnSaveAs, ['btn-danger', 'btn-success'], ['btn-warning']);
        // Снимаем блокировку с элементов
        enableElements(btnUpload, btnBeautify, btnSaveAs);
      }, 200);
    });
  } else {
    // Если нажата отмена - то снимаем блокировку с элементов
    enableElements(btnUpload, btnBeautify, btnSaveAs);
  }
});

// При нажатии по заголовку программы переходим в репо
title.addEventListener('click', () => {
  shell.openExternal('https://github.com/lozunoff/xml-beautifier-app');
});

// При нажатии по типу лицензии переходим в описание лицензии в репо
mit.addEventListener('click', () => {
  shell.openExternal('https://github.com/lozunoff/xml-beautifier-app/blob/master/LICENSE');
});
