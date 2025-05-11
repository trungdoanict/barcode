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
let fs = require('fs');
const https = require('https');
let windowns = {};
const searchHistoryPath = path.join(app.getPath('userData'), 'search-history.json');
function createWindow() {
    windowns['mainWindow'] = new BrowserWindow({
        width: 1024,
        height: 700,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,           // Cho phép sử dụng Node.js trong renderer
            contextIsolation: false,         // Tắt context isolation để cho phép truy cập trực tiếp
            enableRemoteModule: true,        // Cho phép sử dụng remote module
        },
        icon: 'public/img/icon.ico'
    });
    windowns['mainWindow'].loadURL(
        url.format({
            pathname: path.join(__dirname, 'src/views/product/productScan.html'),
            protocol: 'file:',
            slashes: true
        })
    );

    windowns['mainWindow'].on('closed', function () {
        windowns['mainWindow'] = null;
    });
    windowns['mainWindow'].webContents.on('did-finish-load', () => {
        const appDir = app.getPath('userData');
        windowns['mainWindow'].webContents.send('rootFolder', appDir)
    })

    windowns['mainWindow'].setMenu(mainMenu(windowns['mainWindow']));

}
app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
    if (process.env.NODE_ENV === 'development') {
        windowns['mainWindow'].webContents.openDevTools();
    }
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
function getLatestVersionFromGitHub(owner, repo) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${owner}/${repo}/releases/latest`,
            headers: { 'User-Agent': 'my-app' } // Bắt buộc
        };

        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const release = JSON.parse(data);
                resolve(release.tag_name);
            });
        }).on('error', (err) => {
            console.error('Lỗi khi lấy thông tin:', err);
            resolve();
        });
    })
}
ipcMain.on('update-application', () => {
    autoUpdater.checkForUpdates();
});

ipcMain.handle('check-update-version', async (event) => {
    let version = await getLatestVersionFromGitHub('trungdoanict', 'barcode');
    version = version.replace('v', '');
    if (version !== app.getVersion()) {
        return {
            newVersionStatus: true,
            newVersion: version
        }
    } else {
        return {
            newVersionStatus: false
        }
    }
});
autoUpdater.on('checking-for-update', () => {
    console.log('Đang kiểm tra bản cập nhật...');
});
autoUpdater.on('update-available', (info) => {
    console.log('Bản cập nhật có sẵn:', info.version);
});
autoUpdater.on('update-not-available', () => {
    console.log('Không có bản cập nhật mới.');
});
ipcMain.on('start-download', () => {
    console.log('start-download')
    autoUpdater.downloadUpdate();
});
autoUpdater.on('download-progress', (progressObj) => {
    windowns['mainWindow'].webContents.send('download-progress', progressObj.percent);
})

autoUpdater.on('error', (error) => {
    windowns['mainWindow'].webContents.send('error_update');
})


autoUpdater.on('update-downloaded', () => {
    console.log('update-downloaded');
    autoUpdater.quitAndInstall();
});


ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
});

function show_window_input_product(data) {
    windowns['window_input_product'] = new BrowserWindow({
        width: 600,
        height: 600,
        resizable: false,
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
    if (process.env.NODE_ENV === 'development') {
        windowns['window_input_product'].webContents.openDevTools();
    }

    windowns['window_input_product'].on('closed', function () {
        windowns['window_input_product'] = null;
    });
}
function show_modal_review_product(data) {
    windowns['window_review_product'] = new BrowserWindow({
        width: 600,
        height: 500,
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
    if (process.env.NODE_ENV === 'development') {
        windowns['window_review_product'].webContents.openDevTools();
    }


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

ipcMain.handle('show-success-dialog', async (event, message, windowSelect) => {
    let focusedWindow;
    if (windowSelect) {
        focusedWindow = windowns[windowSelect];
    } else {
        focusedWindow = BrowserWindow.getFocusedWindow();
    }

    return dialog.showMessageBox(focusedWindow, {
        type: 'info',
        title: 'Thành công',
        message: message || 'Thao tác thành công',
        buttons: ['OK']
    });
});
// Hiển thị dialog xác nhận
ipcMain.handle('confirm-dialog', async (event, options) => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    const defaults = {
        title: 'Xác nhận',
        message: 'Bạn có chắc chắn muốn thực hiện hành động này?',
        buttons: ['Hủy', 'Xác nhận'],
        defaultId: 1,
        cancelId: 0
    };

    const dialogOptions = { ...defaults, ...options };

    const result = await dialog.showMessageBox(focusedWindow, {
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

// IPC để xử lý đọc lịch sử tìm kiếm
ipcMain.handle('get-search-history', async () => {
    try {
        if (fs.existsSync(searchHistoryPath)) {
            const data = fs.readFileSync(searchHistoryPath, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Error reading search history:', error);
        return [];
    }
});

// IPC để xử lý lưu lịch sử tìm kiếm
ipcMain.handle('save-search-history', async (event, searchHistory) => {
    try {
        fs.writeFileSync(searchHistoryPath, JSON.stringify(searchHistory), 'utf8');
        return true;
    } catch (error) {
        console.error('Error saving search history:', error);
        return false;
    }
});
if (process.env.NODE_ENV === 'development') {
    require('electron-reload')(__dirname, {
        electron: require(path.join(__dirname, 'node_modules', 'electron')),
        watchRenderer: true,
        forceHardReset: false,
        hardResetMethod: 'exit'
    });
}
