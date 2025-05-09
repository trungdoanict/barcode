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
} = require('./public/js/module');
const path = require('path');
const url = require('url');
var fs = require('fs');
let windowns = {};

function createWindow() {
    windowns['mainWindow'] = new BrowserWindow({
        width: 1024,
        height: 700,
        webPreferences: {
            nodeIntegration: true,           // Cho phép sử dụng Node.js trong renderer
            contextIsolation: false,         // Tắt context isolation để cho phép truy cập trực tiếp
            enableRemoteModule: true,        // Cho phép sử dụng remote module
        },
        icon: 'public/img/icon.ico'
    });
    windowns['mainWindow'].loadURL(
        url.format({
            pathname: path.join(__dirname, 'src/views/product/product.html'),
            protocol: 'file:',
            slashes: true
        })
    );

    windowns['mainWindow'].on('closed', function () {
        windowns['mainWindow'] = null;
    });

    windowns['mainWindow'].setMenu(mainMenu(windowns['mainWindow']));

}
app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
    windowns['mainWindow'].webContents.openDevTools();
    globalShortcut.register('Control+Alt+Shift+K', () => {
        windowns['mainWindow'].webContents.openDevTools();
    })
});


app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
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
    windowns['mainWindow'].webContents.send('update_app_event');
});

autoUpdater.on('error', (error) => {
    windowns['mainWindow'].webContents.send('error_update');
})

autoUpdater.on('update-available', () => {
    windowns['mainWindow'].webContents.send('update_available');
});
autoUpdater.on('update-not-available', (info) => {
    windowns['mainWindow'].webContents.send('update-not-available');
})
autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall();
});

autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    windowns['mainWindow'].webContents.send('download-progress', progressObj);
})

ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
});

function show_window_input_product(data) {
    windowns['window_input_product'] = new BrowserWindow({
        width: 1100,
        height: 900,
        title: data.type == 'create' ? 'Thêm sản phẩm' : 'Sửa sản phẩm',
        webPreferences: {
            nodeIntegration: true,           // Cho phép sử dụng Node.js trong renderer
            contextIsolation: false,         // Tắt context isolation để cho phép truy cập trực tiếp
            enableRemoteModule: true        // Cho phép sử dụng remote module
        },
        parent: windowns['mainWindow'],
        modal: true,
        icon: 'public/img/icon.ico'
    });

    windowns['window_input_product'].loadURL(
        url.format({
            pathname: path.join(__dirname, 'src/views/product/productItem.html'),
            protocol: 'file:',
            slashes: true
        })
    );
    windowns['window_input_product'].setMenuBarVisibility(false);
    windowns['window_input_product'].webContents.on('did-finish-load', () => {
        windowns['window_input_product'].webContents.send('data-from-product', data);
    });
    windowns['window_input_product'].webContents.openDevTools();

    windowns['window_input_product'].on('closed', function () {
        windowns['window_input_product'] = null;
    });
}
function show_modal_review_product(data) {
    windowns['window_review_product'] = new BrowserWindow({
        width: 1100,
        height: 900,
        title: 'Thông tin sản phẩm',
        webPreferences: {
            nodeIntegration: true,           // Cho phép sử dụng Node.js trong renderer
            contextIsolation: false,         // Tắt context isolation để cho phép truy cập trực tiếp
            enableRemoteModule: true        // Cho phép sử dụng remote module
        },
        parent: windowns['mainWindow'],
        modal: true,
        icon: 'public/img/icon.ico'
    });

    windowns['window_review_product'].loadURL(
        url.format({
            pathname: path.join(__dirname, 'src/views/product/productReview.html'),
            protocol: 'file:',
            slashes: true
        })
    );
    windowns['window_review_product'].setMenuBarVisibility(false);
    windowns['window_review_product'].webContents.on('did-finish-load', () => {
        windowns['window_review_product'].webContents.send('data-from-product-review', data);
    });
    windowns['window_review_product'].webContents.openDevTools();

    windowns['window_review_product'].on('closed', function () {
        windowns['window_review_product'] = null;
    });
}

ipcMain.on('show_modal_input_product', (event, data) => {
    show_window_input_product(data);
});
ipcMain.on('show_modal_review_product', (event, data) => {
    show_modal_review_product(data);
});
ipcMain.on('close-window', (event, windowSelect) => {
    if (windowns[windowSelect]) {
        windowns[windowSelect].close()
    }
})
ipcMain.handle('show-error-dialog', async (event, message) => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    return dialog.showMessageBox(focusedWindow, {
        type: 'error',
        title: 'Lỗi',
        message: message || 'Đã xảy ra lỗi',
        buttons: ['Đóng']
    });
});

ipcMain.handle('show-success-dialog', async (event, message) => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    return dialog.showMessageBox(focusedWindow, {
        type: 'info',
        title: 'Thành công',
        message: message || 'Thao tác thành công',
        buttons: ['OK']
    });
});
// Hiển thị dialog xác nhận
ipcMain.handle('confirm-dialog', async (event, options) => {
    const defaults = {
        title: 'Xác nhận',
        message: 'Bạn có chắc chắn muốn thực hiện hành động này?',
        buttons: ['Hủy', 'Xác nhận'],
        defaultId: 1,
        cancelId: 0
    };

    const dialogOptions = { ...defaults, ...options };

    const result = await dialog.showMessageBox(mainWindow, {
        type: 'question',
        ...dialogOptions
    });

    // Trả về true nếu người dùng nhấn xác nhận (button index 1)
    return result.response === dialogOptions.defaultId;
});

// Hiển thị dialog lưu file
ipcMain.handle('save-dialog', async (event, options) => {
    const defaults = {
        title: 'Lưu file',
        defaultPath: app.getPath('documents'),
        buttonLabel: 'Lưu',
        filters: [
            { name: 'All Files', extensions: ['*'] }
        ]
    };

    const dialogOptions = { ...defaults, ...options };
    const result = await dialog.showSaveDialog(mainWindow, dialogOptions);

    return result.canceled ? null : result.filePath;
});

// Hiển thị dialog mở file
ipcMain.handle('open-dialog', async (event, options) => {
    const defaults = {
        title: 'Chọn file',
        defaultPath: app.getPath('documents'),
        buttonLabel: 'Mở',
        properties: ['openFile'],
        filters: [
            { name: 'All Files', extensions: ['*'] }
        ]
    };

    const dialogOptions = { ...defaults, ...options };
    const result = await dialog.showOpenDialog(mainWindow, dialogOptions);

    return result.canceled ? [] : result.filePaths;
});

