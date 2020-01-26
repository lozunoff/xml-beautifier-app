const { dialog } = require('electron').remote; // eslint-disable-line
const fs = require('fs');
const XmlBeautify = require('xml-beautify');

// Получаем элементы интерфейса, с которыми будем взаимодействовать
const btnUpload = document.getElementById('btnUpload');
const btnBeautify = document.getElementById('btnBeautify');
const btnSaveAs = document.getElementById('btnSaveAs');
const input = document.getElementById('input');
const output = document.getElementById('output');

// Обрабатываем нажатие кнопки "Upload"
btnUpload.addEventListener('click', async () => {
  // Блокируем кнопку для повторного нажатия
  btnUpload.setAttribute('disabled', 'disabled');

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
        btnUpload.classList.remove('btn-warning');
        btnUpload.classList.remove('btn-danger');
        btnUpload.classList.add('btn-success');
      } else {
        // Если файл прочитать не удалось - сигнализируем цветом кнопки о провале
        btnUpload.classList.remove('btn-warning');
        btnUpload.classList.remove('btn-success');
        btnUpload.classList.add('btn-danger');
      }

      setTimeout(() => {
        // По истечению таймаута сбрасываем стили кнопки на дефолтные
        btnUpload.classList.remove('btn-success');
        btnUpload.classList.remove('btn-danger');
        btnUpload.classList.add('btn-warning');
        // Разрешаем повторное нажатие кнопки
        btnUpload.removeAttribute('disabled');
      }, 200);
    });
  } else {
    // Если нажата отмена - то просто разрешаем повторное нажатие кнопки
    btnUpload.removeAttribute('disabled');
  }
});

// Обрабатываем нажатие кнопки "Upload"
btnBeautify.addEventListener('click', () => {
  // Блокируем кнопку для повторного нажатия
  btnBeautify.setAttribute('disabled', 'disabled');

  // Считываем проблемный контент и пытаемся привести в нормальный вид
  const beautify = new XmlBeautify().beautify(input.value);

  // Если преобразование прошло без проблем
  if (beautify.indexOf('This page contains the following errors') === -1) {
    // Помещаем преобразованный контент во второй <textarea>
    output.value = beautify;
    // Сигнализируем цветом кнопки об успешности операции
    btnBeautify.classList.remove('btn-warning');
    btnBeautify.classList.remove('btn-danger');
    btnBeautify.classList.add('btn-success');
  } else {
    // Если возникли пробелмы - сигнализируем цветом кнопки о провале
    btnBeautify.classList.remove('btn-warning');
    btnBeautify.classList.remove('btn-success');
    btnBeautify.classList.add('btn-danger');
    // Парсим ответ, находим ошибку и помещаем ее в <textarea> вместо контента
    const error = beautify.match(/<div.+>(.+)\s?<\/div>/i)[1];
    output.value = `Error: ${error}`;
  }

  setTimeout(() => {
    // По истечению таймаута сбрасываем стили кнопки на дефолтные
    btnBeautify.classList.remove('btn-success');
    btnBeautify.classList.remove('btn-danger');
    btnBeautify.classList.add('btn-warning');
    // Разрешаем повторное нажатие кнопки
    btnBeautify.removeAttribute('disabled');
  }, 200);
});

// Обрабатываем нажатие кнопки "Save As..."
btnSaveAs.addEventListener('click', async () => {
  // Блокируем кнопку для повторного нажатия
  btnSaveAs.setAttribute('disabled', 'disabled');

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
        btnSaveAs.classList.remove('btn-warning');
        btnSaveAs.classList.remove('btn-danger');
        btnSaveAs.classList.add('btn-success');
      } else {
        // Если возникли пробелмы - сигнализируем цветом кнопки о провале
        btnSaveAs.classList.remove('btn-warning');
        btnSaveAs.classList.remove('btn-success');
        btnSaveAs.classList.add('btn-danger');
      }

      setTimeout(() => {
        // По истечению таймаута сбрасываем стили кнопки на дефолтные
        btnSaveAs.classList.remove('btn-success');
        btnSaveAs.classList.remove('btn-danger');
        btnSaveAs.classList.add('btn-warning');
        // Разрешаем повторное нажатие кнопки
        btnSaveAs.removeAttribute('disabled');
      }, 200);
    });
  } else {
    // Если нажата отмена - то просто разрешаем повторное нажатие кнопки
    btnSaveAs.removeAttribute('disabled');
  }
});
