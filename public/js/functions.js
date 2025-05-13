const $ = require('jquery');
const crypto = require('crypto');
window.addEventListener('DOMContentLoaded', () => {
    document.body.classList.remove('loading')
})
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
function pad(num, size = 2) {
  return num.toString().padStart(size, '0');
}

function getTimestampString() {
  const now = new Date();
  return (
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  ); // Ví dụ: "0513154533" → 10 ký tự
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(crypto.randomBytes(1)[0] / 256 * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateCryptoCode(totalLength = 32) {
  const timestamp = getTimestampString(); // 14 ký tự
  const remainingLength = totalLength - timestamp.length;

  const randomPart = crypto.randomBytes(Math.ceil(remainingLength / 2)).toString('hex').toUpperCase();
  const fullString = (timestamp + randomPart).slice(0, totalLength); // đảm bảo đủ độ dài

  const shuffled = shuffleArray(fullString.split('')).join('');
  return shuffled;
}
module.exports = {
    generateMixedBarcode,
    generateCryptoCode
}