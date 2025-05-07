const {
    app,
    Menu,
} = require('electron');
function mainMenu(mainWindow) { 
    return Menu.buildFromTemplate([
        {
            label: 'Scan Barcode',
            click: () => {
                mainWindow.loadFile('src/views/index.html');
            }
        },
        {
            type: 'separator',
        },
        {
            label: 'Product Manager',
            click: () => {
                mainWindow.loadFile('src/views/product.html');
            }
        },
        {
            type: 'separator',
        },
        {
            label: 'Account Manager',
            click: () => {
                mainWindow.loadFile('src/views/account.html');
            }
        },
        {
            type: 'separator',
        },
        {
            label: 'Exit',
            click: () => {
                app.quit()
            }
        },
        {
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
        }
    ])
}
module.exports = {
    mainMenu
}