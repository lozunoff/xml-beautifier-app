const { remote } = require('electron');

// Получаем элементы интерфейса, с которыми будем взаимодействовать
const btnOk = document.getElementById('btnOk');
const btnCancel = document.getElementById('btnCancel');
const inputTabSize = document.getElementById('inputTabSize');
const selectEndLine = document.getElementById('selectEndLine');
const selfClosingTagsFlag = document.getElementById('selfClosingTagsFlag');
const delCommentsFlag = document.getElementById('delCommentsFlag');

// Проверяем наличие настроек в локальном храниище браузера
if (window.localStorage.options) {
  // Если настройки имееются, проставляем соответствующие значения в форме
  const options = JSON.parse(window.localStorage.options);
  inputTabSize.value = options.tabSize;
  selectEndLine.value = options.endLine
    .replace(/^\r\n$/, 'crlf')
    .replace(/^\n$/, 'lf')
    .replace(/^\r$/, 'cr');
  selfClosingTagsFlag.checked = options.useSelfClosingTags;
  delCommentsFlag.checked = options.delComments;
}

// Обрабатываем нажатие кнопки "Ok"
btnOk.addEventListener('click', () => {
  // Формируем объект со значениями формы
  const options = {
    tabSize: Number.parseInt(inputTabSize.value, 10),
    endLine: selectEndLine.value
      .replace('crlf', '\r\n')
      .replace('lf', '\n')
      .replace('cr', '\r'),
    useSelfClosingTags: selfClosingTagsFlag.checked,
    delComments: delCommentsFlag.checked,
  };

  // Сохраняем объект с настройками в локальном хранилище
  window.localStorage.setItem('options', JSON.stringify(options));

  // Скрываем окно с настрйоками
  remote.getCurrentWindow().hide();
});

// Обрабатываем нажатие кнопки "Cancel"
btnCancel.addEventListener('click', () => {
  // Скрываем окно с настрйоками
  remote.getCurrentWindow().hide();
});
