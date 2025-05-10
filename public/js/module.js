const {
    app,
    Menu,
} = require('electron');
function mainMenu(mainWindow) { 
    return Menu.buildFromTemplate([
        {
            label: 'Quét barcode',
            click: () => {
                mainWindow.loadFile('src/views/product/productScan.html');
            }
        },
        {
            type: 'separator',
        },
        {
            label: 'Quản lý sản phẩm',
            click: () => {
                mainWindow.loadFile('src/views/product/product.html');
            }
        },
        {
            type: 'separator',
        },
        {
            label: 'Quản lý tài khoản',
            click: () => {
                mainWindow.loadFile('src/views/account.html');
            }
        },
        {
            label: 'Thông tin ứng dụng',
            click: () => {
                mainWindow.loadFile('src/views/aplication.html');
            }
        },
        {
            type: 'separator',
        },
        {
            label: 'Thoát',
            click: () => {
                app.quit()
            }
        }
    ])
}
module.exports = {
    mainMenu
}