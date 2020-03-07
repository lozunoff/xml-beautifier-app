const beautify = (xml, options = {
  tabSize: 4,
  endLine: '\r\n',
  useSelfClosingTags: false,
  delComments: false,
}) => {
  // Разбираем переданные настройки или присваиваем значения по умолчанию
  const {
    tabSize, endLine, useSelfClosingTags, delComments,
  } = options;

  // Наводим красоту в исходном тексте - обрезаем лишние пробелы, переносы и т.д.
  let input = xml.trim()
    .replace(/[\r\n\t]+/g, '')
    .replace(/>\s+</g, '><')
    .replace(/ {2,}/g, ' ')
    .replace(/&/g, '&amp;');

  // Если получен пустой текст - бросаем исключение
  if (!input) {
    throw new Error('Document is empty!');
  }

  // Удаляем комментарии, если это необходимо
  if (delComments) {
    input = input.replace(/(<!--.*?-->)|(<!--[\S\s]+?-->)|(<!--[\S\s]*?$)/g, '');
  }

  // Преобразовываем текст в xml-документ
  const parser = new DOMParser();
  const parsedXml = parser.parseFromString(input, 'text/xml');

  // Ищем в результатах преобразования тег <parsererror>, сигнализирующий о провале операции
  const parsererror = parsedXml.getElementsByTagName('parsererror');
  // Если тег найден - бросаем исключение
  if (parsererror.length) {
    throw new Error('XML Parsing Error!');
  }

  // Массив для формирования результата
  const output = [];

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
  // Свойство 'tagType' отвечает за нужный тип тега (открывающий, закрывающий, комментарий)
  const stack = [{ node: parsedXml.children[0], tagType: 'opening' }];

  // Счетчик для остеживания текущего значения отступов
  let indentCounter = 0;

  // Перебираем дерево пока есть элементы в стеке
  while (stack.length) {
    // Берем из стека последний элемент
    const element = stack[stack.length - 1];
    // Получаем текущий xml-тег
    const { node } = element;
    // Формируем новую строку для результата
    let str = '';

    // Если тип тега - "открывающий"
    if (element.tagType === 'opening') {
      // Перебираем имеющиеся у ноды атрибуты
      let attrs = '';
      for (let i = node.attributes.length - 1; i >= 0; i -= 1) {
        const attr = node.attributes[i];
        attrs += ` ${attr.name}="${attr.textContent}"`;
      }

      // Добавляем к результату перенос строки (исключение - корневой тег)
      if (node.parentNode.nodeType !== 9) {
        str += endLine;
      }

      // Формируем отступ перед тегом
      for (let j = 0; j < indentCounter; j += 1) {
        str += ' ';
      }

      // Формируем начало открывающего тега
      str += `${tags.start.prefix}${node.tagName}${attrs}`;

      // Если нода пустая и включен режим само-закрывающихся тегов
      if (!node.childNodes.length && useSelfClosingTags) {
        // Используем само-закрывающийся тег
        str += tags.start.short;
      } else {
        // Иначе - закрываем как обычно
        str += tags.start.suffix;
      }

      // Если у текущего узла есть потомки, среди которых нет текста - увеличиваем отступ
      if (node.children.length) {
        indentCounter += tabSize;
      }

      // Перебираем потомков
      if (node.childNodes.length) {
        for (let i = node.childNodes.length - 1; i >= 0; i -= 1) {
          if (node.childNodes[i].nodeType === 3) {
            // Если потомок - текстовый узел - добавляем контент
            str += node.childNodes[i].nodeValue;
          } else if (node.childNodes[i].nodeType === 8) {
            // Если потомок - комментарий - добавляем в стек элемент с типом тега "comment"
            stack.push({ node: node.childNodes[i], tagType: 'comment' });
          } else if (node.childNodes[i].nodeType === 1) {
            // Если потомок обычный узел - добавляем в стек новый элемент с типом тега "opening"
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
          str += endLine;
          indentCounter -= tabSize;
          for (let j = 0; j < indentCounter; j += 1) {
            str += ' ';
          }
        }
        // Вставляем обычный закрывающий тег
        str += `${tags.end.prefix}${node.tagName}${tags.end.suffix}`;
      }

      // Удаляем из стека последний элемент
      stack.pop();
    }

    // Если тип тега - "комментарий"
    if (element.tagType === 'comment') {
      str += endLine;
      for (let j = 0; j < indentCounter; j += 1) {
        str += ' ';
      }
      str += `<!-- ${node.nodeValue} -->`;
      // Удаляем из стека последний элемент
      stack.pop();
    }

    // Добавляем сформированную строку в итоговый массив
    output.push(str);
  }

  // Проверяем, была ли декларация у исходного текста
  if (input.indexOf('<?xml') !== -1) {
    // Формируем декларацию и добавляем в результат
    let declaration = '<?xml';

    // Ищем в исходной декларации версию xml, кодировку и параметр standalone
    const version = input.match(/<\?xml.+version=['"]([\d.]+)['"].*\?>/i);
    const encoding = input.match(/<\?xml.+encoding=['"]([\w-]+)['"].*\?>/i);
    const standalone = input.match(/<\?xml.+standalone=['"](yes|no)['"].*\?>/i);

    if (version) {
      declaration += ` version="${version[1]}"`;
    }

    if (encoding) {
      declaration += ` encoding="${encoding[1]}"`;
    }

    if (standalone) {
      declaration += ` standalone="${standalone[1]}"`;
    }

    declaration += '?>';
    output.unshift(`${declaration}${endLine}`);
  }

  // Добавляем перенос после крайнего элемента
  output.push(endLine);

  // Возвращаем результат
  return output;
};

module.exports = beautify;
