const {
    app,
    BrowserWindow,
    ipcMain,
    dialog,
    globalShortcut
} = require('electron');
const {
    autoUpdater
} = require('electron-updater');
const {
    mainMenu
} = require('./src/module');
const path = require('path');
const url = require('url');
var fs = require('fs');
let mainWindow,win_active_code,window_account, window_edit_account;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            backgroundThrottling: false
        },
        icon:'public/img/icon.ico'
    });
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, 'src/views/product.html'),
            protocol: 'file:',
            slashes: true
        })
    );

    mainWindow.on('closed', function() {
        mainWindow = null;
    });

    mainWindow.setMenu(mainMenu(mainWindow)); 

}

app.on('ready', () => {
    createWindow();
    mainWindow.webContents.openDevTools();
    globalShortcut.register('Control+Alt+Shift+K', () => {
        mainWindow.webContents.openDevTools();
    })
});

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function() {
    if (mainWindow === null) {
        createWindow();
    }
});

ipcMain.on('app_version', (event) => {
    event.sender.send('app_version', {
        version: app.getVersion()
    });
});

ipcMain.on('AppRestart', (event) => {
    app.quit();
    app.relaunch();
});


ipcMain.on('update_app_event', (event) => {

    autoUpdater.checkForUpdates();
    mainWindow.webContents.send('update_app_event');
});

autoUpdater.on('error', (error) => {
    mainWindow.webContents.send('error_update');
})

autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update_available');
});
autoUpdater.on('update-not-available', (info) => {
    mainWindow.webContents.send('update-not-available');
})
autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall();
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  mainWindow.webContents.send('download-progress',progressObj);
})

ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
});