const beautify = (xml, options = {}) => {
  // Разбираем переданные настройки или присваиваем значения по умолчанию
  const tabSize = options.tabSize || 4;
  const endLine = options.endLine || '\r\n';
  const useSelfClosingTags = (!options.useSelfClosingTags) ? false : options.useSelfClosingTags;
  const delComments = (!options.delComments) ? true : options.delComments;

  // Обрезаем концевые пробелы
  let input = xml.trim().replace(/[\r\n\t]+/g, '').replace(/>\s+</g, '><');

  // Если получен пустой текст - бросаем исключение
  if (!input) {
    throw new Error('Document is empty');
  }

  // Удаляем комментарии, если удаление не отключено
  if (delComments) {
    input = input.replace(/<!--[\s\S]*-->/ig, '');
  }

  // Преобразовываем текст в xml-документ
  const parser = new DOMParser();
  const parsedXml = parser.parseFromString(input, 'text/xml');

  // Ищем в результатах преобразования тег <parsererror>, сигнализирующий о провале операции
  const parsererror = parsedXml.getElementsByTagName('parsererror');
  // Если тег найден - бросаем исключение
  if (parsererror.length) {
    throw new Error('XML Parsing Error');
  }

  // Переменная для формирования результата
  let output = '';

  // Набор символов для формирования тегов
  const tags = {
    start: {
      prefix: '<',
      suffix: '>',
      short: '/>',
    },
    end: {
      prefix: '</',
      suffix: '>',
    },
  };

  // Создаем стек для перебора xml-дерева и помещаем в него первый элемент - корневой тег
  // Свойство 'tagType' отвечает за переключение между открывающим и закрывающим тегами
  const stack = [{ node: parsedXml.children[0], tagType: 'opening' }];

  // Счетчик для остеживания текущего значения отступов
  let indentCounter = 0;

  // Перебираем дерево пока есть элементы в стеке
  while (stack.length) {
    // Берем из стека последний элемент
    const element = stack[stack.length - 1];
    // Получаем текущий xml-тег
    const { node } = element;

    // Если тип тега - "открывающий"
    if (element.tagType === 'opening') {
      // Перебираем имеющиеся у ноды атрибуты
      let attrs = '';
      for (let i = 0; i < node.attributes.length; i += 1) {
        const attr = node.attributes[i];
        attrs += ` ${attr.name}="${attr.textContent}"`;
      }

      // Добавляем к результату перенос строки
      if (node.parentNode.nodeType !== 9) {
        output += endLine;
      }

      // Формируем отступ перед тегом
      for (let j = 0; j < indentCounter; j += 1) {
        output += ' ';
      }

      // Формируем начало открывающего тега
      output += `${tags.start.prefix}${node.tagName}${attrs}`;

      // Если нода пустая и включен режим само-закрывающихся тегов
      if (!node.childNodes.length && useSelfClosingTags) {
        // Используем само-закрывающийся тег
        output += tags.start.short;
      } else {
        // Иначе - закрываем как обычно
        output += tags.start.suffix;
      }

      // Если у текущего узла есть потомки, среди которых нет текста - увеличиваем отступ
      if (node.children.length) {
        indentCounter += tabSize;
      }

      // Перебираем потомков
      if (node.childNodes.length) {
        for (let i = node.childNodes.length - 1; i >= 0; i -= 1) {
          if (node.childNodes[i].nodeType === 3) {
            // Если потомок текстовый узел - добавляем контент
            output += node.childNodes[i].nodeValue;
          } else if (node.childNodes[i].nodeType === 8) {
            // Если потомок комментарий - добавляем отступ и сам комментарий
            output += endLine;
            for (let j = 0; j < indentCounter; j += 1) {
              output += ' ';
            }
            output += `<!-- ${node.childNodes[i].nodeValue} -->`;
          } else if (node.childNodes[i].nodeType === 1) {
            // Если потомок обычный узел - добавляем в стек новый элемент
            stack.push({ node: node.childNodes[i], tagType: 'opening' });
          }
        }
      }

      // Меняем тип тега текущего элемента на закрывающий
      element.tagType = 'closing';
    }

    // Если тип тега - "закрывающий" и последний элемент в стеке равен текущей ноде
    if (element.tagType === 'closing' && (stack[stack.length - 1].node === node)) {
      // Проверяем, что узел не пустой и выключен режим само-закрывающихся тегов
      if (node.childNodes.length || !useSelfClosingTags) {
        // Проверяем, что перед тегом не было текста
        if (node.children.length) {
          // Добавляем перенос строки и уменьшаем отступ
          output += endLine;
          indentCounter -= tabSize;
          for (let j = 0; j < indentCounter; j += 1) {
            output += ' ';
          }
        }
        // Вставляем обычный закрывающий тег
        output += `${tags.end.prefix}${node.tagName}${tags.end.suffix}`;
      }

      // Удаляем из стека последний элемент
      stack.pop();
    }
  }

  // Проверяем, была ли декларация у исходного текста
  if (input.indexOf('<?xml') !== -1) {
    // Получаем значение исходной кодировки или присваиваем значение по умолчанию
    const encoding = input.match(/<\?xml.+encoding=['"]([\w-]+)['"].*\?>/i)[1] || 'utf-8';
    // Получаем версию xml или присваиваем значение по умолчанию
    const version = input.match(/<\?xml.+version=['"]([\d.]+)['"].*\?>/i)[1] || '1.0';
    // Формируем декларацию и добавляем в результат
    const declaration = `<?xml version="${version}" encoding="${encoding}"?>`;
    output = `${declaration}${endLine}${output}`;
  }

  // Возвращаем результат
  return `${output}${endLine}`;
};

module.exports = beautify;
