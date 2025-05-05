/*Functions here*/
const electron = require('electron');
const puppeteer = require('puppeteer');

// open chrome function
async function startUpload() {
    // Create a new browser. By default, the browser is headless,
    // which means it runs in the background and doesn't appear on
    // the screen. Setting `headless: false` opens up a browser
    // window so you can watch what happens.
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        slowMo: 1000,
        executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        args:[
            '--no-sandbox',
            '--user-data-dir=C:\\Users\\macintosh\\AppData\\Local\\Google\\Chrome\\User Data',
            '--profile-directory=Profile 2'
        ]
    });

    // Open a new page and navigate to google.com
    const [page] = await browser.pages();
    // await page.goto('https://google.com');
    await page.goto('https://www.teepublic.com/');

    // done
    console.log('Open chrome done - wait for some seconds to begin next step');

    
    await loginTee(page);

    await uploadTee(page);

    // Wait 2 seconds
    /* return new Promise((resolve) => {
	    setTimeout(() => resolve(true), 5000);
  	}) */

    // Close the browser and exit the script
    // await browser.close();
}

// solve popup problem
// $('.bx-close-outside').click()

// login tee
async function loginTee(page) {
	console.log('start login process');
	// open login
    const hoverLoginSelector = '.m-head__avatar-link'
    await page.waitForSelector(hoverLoginSelector, {visible: true, timeout: 2000}).catch(() => { console.log('Teepublic loads failed') })
    await page.hover(hoverLoginSelector)

    const loginLinkSelector = '#login-link'
    /* await page.waitForSelector(loginLinkSelector);
    await page.click(loginLinkSelector);
    await teeSleep(1); */
    await page.waitForSelector(loginLinkSelector, {visible: true, timeout: 2000}).catch(() => { console.log('Wait for login link timeout') })
    await teeClick(loginLinkSelector, page);

    // type user password
    let usernameSelector = '#session_email'
    let passwordSelector = '#session_password'
    let loginSubmitBtn = '#login'
    await page.waitForSelector(usernameSelector)
    await page.type(usernameSelector, 'tranddong@gmail.com')
    await page.type(passwordSelector, 'bia2070')
    await teeClick(loginSubmitBtn, page);

	return new Promise((resolve) => {
		setTimeout(() => resolve('Login teepublic done'), randomInt(1500, 3500))
	})
}

// upload a tee
async function uploadTee(page) {
	console.log('start upload process');
	// open upload form m-head__avatar-link
	const hoverAvatarSelector = '.m-head__avatar-link';
	await page.waitForSelector(hoverAvatarSelector, {visible: true, timeout: 2000}).catch(() => { return false });
	await page.hover(hoverAvatarSelector);

	const uploadLinkSelector = '.m-head__account .m-head__dropdown-link:first';
	await page.waitForSelector(uploadLinkSelector, {visible: true, timeout: 2000}).catch(() => { return false });
	await teeClick(uploadLinkSelector);

	await teeSleep(1);

	const singleUploadSelector = '.m-uploader-funnel__options .m-uploader-funnel__option:first';
	const multiUploadSelector = '.m-uploader-funnel__options .m-uploader-funnel__option:last';
	await teeClick(singleUploadSelector);

	// upload design
	const design_path = 'C:\\Users\\macintosh\\Dropbox\\vps1\\acc1\\1969.png';
	const uploadBtn = await page.$('.jsUploaderFileInput');
	// check file exist
	const fs = require('fs');
	try {
		if (fs.existsSync(design_path)) {
			await uploadBtn.uploadFile(design_path);
		}
	} catch(err) {
		console.log(err)
	}
	
	return new Promise((resolve) => {
		setTimeout(() => resolve('Upload a design done'), randomInt(1500, 3500))
	})
}

/* Export module functions */
module.exports = {
	startUpload: startUpload
}

/* General Functions */
function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low)
}

async function teeSleep(volume = 1) {
	let r = randomInt(1500, 3500)
	switch (volume) {
		case 2: r = randomInt(5000, 8000)
	}

	console.log('delay ' + r + ' milliseconds')

	return new Promise((resolve) => {
		setTimeout(() => resolve(r), r)
	})
}

async function teeClick(selector, page) {
    try {
      await page.waitForSelector(selector , {
        visible: true, timeout: 10000
      })
      await page.evaluate((selector) => document.querySelector(selector).click(), selector);
    } catch (err) {
      console.log('click failed ' + err)
      throw err
    }
}