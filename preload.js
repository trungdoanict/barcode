const { contextBridge, ipcRenderer } = require('electron');

// Hiển thị các API an toàn sang renderer process thông qua contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
  // Đối với electron dialog
  showErrorDialog: (message) => ipcRenderer.invoke('show-error-dialog', message),
  showSuccessDialog: (message) => ipcRenderer.invoke('show-success-dialog', message),
  
  // Các chức năng khác nếu cần
  confirmDialog: (options) => ipcRenderer.invoke('confirm-dialog', options),
  saveDialog: (options) => ipcRenderer.invoke('save-dialog', options),
  openDialog: (options) => ipcRenderer.invoke('open-dialog', options)
});

// Bạn cũng có thể thêm các hàm hỗ trợ khác ở đây
console.log('Preload script đã được tải.');