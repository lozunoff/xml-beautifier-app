const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Обрабатываем на Windows события создания/удаления ярлыков при инсталяции/деинсталяции приложения
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Создаем главное окно приложения
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 690,
    minWidth: 990,
    minHeight: 690,
    webPreferences: {
      nodeIntegration: true,
      devTools: false,
    },
  });

  // Загружаем в главное окно app.html
  mainWindow.loadFile(path.join(__dirname, 'html/app.html'));

  // Создаем окно с настройками
  const settingsWindow = new BrowserWindow({
    width: 400,
    height: 300,
    minWidth: 400,
    minHeight: 300,
    parent: mainWindow,
    modal: true,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
      devTools: false,
    },
    show: false,
  });

  // Загружаем в окно settings.html
  settingsWindow.loadFile(path.join(__dirname, 'html/settings.html'));

  // Скрываем модальное окно вместо закрытия
  settingsWindow.on('close', (e) => {
    e.preventDefault();
    settingsWindow.hide();
  });
};

// Скрываем стандартное меню окна
Menu.setApplicationMenu(null);

// Приступаем к созданию окна после инициализации приложения
app.on('ready', createWindow);

// Выходим из приложения по закрытию всех окон
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Создаем окно по клику на иконку в панели OS X
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
