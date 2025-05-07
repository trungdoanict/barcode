const $ = require('jquery');
function generateMixedBarcode() {
    const now = new Date();
    const pad = (n, width = 2) => n.toString().padStart(width, '0');
	
    // Lấy chuỗi thời gian: 13 ký tự
    const timeChars = (
      pad(now.getMonth() + 1) +
      pad(now.getDate()) +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds()) +
      pad(now.getMilliseconds(), 3)
    ).split(''); // Array 13 ký tự
	
    // Tạo 19 ký tự ngẫu nhiên
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomChars = [];
    for (let i = 0; i < 19; i++) {
      randomChars.push(charset[Math.floor(Math.random() * charset.length)]);
    }
  
    // Gộp hai mảng lại và trộn ngẫu nhiên
    const allChars = [...timeChars, ...randomChars];
  
    // Hàm trộn mảng Fisher-Yates
    for (let i = allChars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allChars[i], allChars[j]] = [allChars[j], allChars[i]];
    }
  
    // Trả về chuỗi barcode 32 ký tự đã trộn
    return allChars.join('');
}

module.exports = {
    generateMixedBarcode
}