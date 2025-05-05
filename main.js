const {
    app,
    BrowserWindow,
    ipcMain,
    session,
    dialog,
    Menu,
    globalShortcut
} = require('electron');
const {
    autoUpdater
} = require('electron-updater');

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
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file:',
            slashes: true
        })
    );

    mainWindow.on('closed', function() {
        mainWindow = null;
    });
    mainWindow.webContents.once('dom-ready', () => {
        //load file config
        mainWindow.webContents.send('KDP',app.getPath('documents').replace(/\\/g,"/")+'/KDP');
        if (fs.existsSync(app.getPath('documents')+'/KDP/code.json')) {
            fs.readFile(app.getPath('documents')+'/KDP/code.json', 'utf8', function(err, data) {
                if (!err) 
                {
                    mainWindow.webContents.send('set_code_id',data);
                }
                
            });
        } else 
        {
            //create_window_active_code(mainWindow,app);   
            //mainWindow.webContents.send('RemovelocalStorage');
        }
    });

    var menu = Menu.buildFromTemplate([
        {
            label: 'Menu',
            submenu: [
                {label:'Exit', click() { app.quit() } }
            ]
        },
        /*{
            label: 'View',
            submenu: [
              { role: 'reload' },
              { role: 'forcereload' },
              { type: 'separator' },
              { role: 'zoomin' },
              { role: 'zoomout' },
              { type: 'separator' },
              { role: 'togglefullscreen' }
            ]
        }*/
    ])
    mainWindow.setMenu(menu); 

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



ipcMain.on('show_modal_create_account', (event) => {
    show_window_account(app);
});
ipcMain.on('hiden_modal_create_account', (event,data) => {
    window_account.close();
    mainWindow.webContents.send('reload_list_account',data);
});

ipcMain.on('show_modal_edit_account', (event, account_data) => {
    show_edit_account(app, account_data);
});
ipcMain.on('hide_modal_edit_account', (event, dataObj) => {
    window_edit_account.close();
    mainWindow.webContents.send('reload_edit_account', dataObj);
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

ipcMain.on('active_code_success', (event,data) => {
    dialog.showMessageBox(win_active_code, {
        'type' : 'warning',
        'title' : 'Kích hoạt code thành công.',
        'message' : 'Kích hoạt code thành công.',
        'detail' : 'Code này đã được sử dụng, code này sẽ không được sử dụng nữa.'
    }, (response) => {
        var dir = app.getPath('documents')+'/KDP';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);

            var dirs = app.getPath('documents')+'/KDP/db';
            if (!fs.existsSync(dirs)){
                fs.mkdirSync(dirs);
            };

        };
        fs.writeFile(app.getPath('documents')+'/KDP/code.json', data._id, (err) => {
            if(!err){
                mainWindow.webContents.send('set_code_id',data._id);
                mainWindow.webContents.send('KDP',app.getPath('documents').replace(/\\/g,"/")+'/KDP');
                win_active_code.hide();
            }
        });

        
    })
});

ipcMain.on('show_dialog', (event,data) => {
    dialog.showMessageBox( {
        'type' : data.type,
        'title' : data.title,
        'message' : data.message,
        'detail' : data.detail
    }, (response) => {
        
    })
});

ipcMain.on('code_active_fail', (event) => {
    
    fs.unlink(app.getPath('documents')+'/KDP/code.json', (err) => {

        if (!err) {
            app.quit();
            app.relaunch();
        }
    })
    
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
    //mainWindow.webContents.send('update_downloaded');
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

function create_window_active_code(mainWindow,app){
    win_active_code = new BrowserWindow({
        width: 400,
        height: 400,
        webPreferences: {
            nodeIntegration: true,
        },
        parent: mainWindow,
        icon:'public/img/icon.ico'
    });
    win_active_code.loadURL(
        url.format({
            pathname: path.join(__dirname, 'src/active-code.html'),
            protocol: 'file:',
            slashes: true
        })
    );
    
    // win_active_code.webContents.openDevTools();

    win_active_code.on('closed', function() {
        win_active_code = null;
        app.quit();
    });
}
function show_window_account(app){
    window_account = new BrowserWindow({
        width: 500,
        height: 500,
        webPreferences: {
            nodeIntegration: true,
        },
        parent: mainWindow,
        icon:'public/img/icon.ico'
    });
    window_account.loadURL(
        url.format({
            pathname: path.join(__dirname, 'src/account.html'),
            protocol: 'file:',
            slashes: true
        })
    );
    
    // window_account.webContents.openDevTools();

    window_account.on('closed', function() {
        window_account = null;
        
    });
} 

function show_edit_account(app, account_data){
    window_edit_account = new BrowserWindow({
        width: 500,
        height: 500,
        webPreferences: {
            nodeIntegration: true,
        },
        parent: mainWindow,
        icon:'public/img/icon.ico'
    });

    setTimeout(function(){
        window_edit_account.webContents.send('edit_account_data', account_data);
    }, 2000);
        

    window_edit_account.loadURL(
        url.format({
            pathname: path.join(__dirname, 'src/account_edit.html'),
            protocol: 'file:',
            slashes: true
        })
    );
    
    // window_edit_account.webContents.openDevTools();

    window_edit_account.on('closed', function() {
        mainWindow.webContents.send('reset_edit_btn');
        window_edit_account = null;
    });
}