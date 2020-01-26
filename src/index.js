const { app, BrowserWindow } = require('electron'); // eslint-disable-line
const path = require('path');

// Обработка создания/удаления ярлыков при установке/удалении
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Переменная для хранения глобальной ссылки на объект окна
let mainWindow;

const createWindow = () => {
  // Создаём окно браузера
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 690,
    minWidth: 470,
    minHeight: 542,
    webPreferences: {
      nodeIntegration: true,
      devTools: false,
    },
  });

  // Загружаем UI
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Скрыть стандартное меню
  mainWindow.removeMenu();

  // Обрабатываем событие закрытия окна
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// Приступаем к созданию окна после инициализации Electron
app.on('ready', createWindow);

// Выходим, когда все окна будут закрыты.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Пересоздаем окно на MacOS после того, как на иконку в доке нажали и других открытых окон нет
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
