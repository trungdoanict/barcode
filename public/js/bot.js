/*Functions here*/
const electron = require('electron');
const puppeteer = require('puppeteer-core');
var child = require('child_process');
var axios = require('axios');
const fs = require('fs');
const ExcelJS = require('exceljs');
const $ = require('jquery');
const config = require('./../../config.js');
var ps = require('ps-node');

/* ------ NEW CODE FROM KUBIA --------*/
let Merch = null;
let tout15 = 15000;
let tout60 = 60000;
/* --- Params --- */
let GExePath = '';
let locationPath = '';
let ImgUploadTout = 5; //minutes
let reuploadTimer = 7; //minutes
let Speed = 70;
let Remember = false;
let AccConfig = null;
let log = null;
let uploadPause = 0;

// Merch sites
const PageMerch = 'https://kdp.amazon.com/';
let PageDashboard = 'https://kdp.amazon.com/';
const PageBookShelf = 'https://kdp.amazon.com/en_US/bookshelf';
const PageReport = 'https://kdp.amazon.com/en_US/reports-new?ref_=kdp_BS_D_TN_rp';
const PageAnalyze = 'https://merch.amazon.com/analyze';
const PageTest = 'http://localhost:8080/merch/signin.html';

// Merch selector
const logginPageSel = "#a-page";
const KDPPageSel = "#page-container";

/* --- Functions --- */
const {
    isPageLoggedIn,
    fillLogin,
    botUploadEbook,
    botUploadPPB,
    SaleFuncs,
    UnpublishFuncs,
    ApiFuns,
    botSleep,
    botClick,
    botPageNotLoad,
    getSelector,
    test
} = require('./functions');

function botInit(a, b, c, r, d, e, f, g) { // init params for bot
    GExePath = a;
    locationPath = b;
    ImgUploadTout = c;
    reuploadTimer = r;
    Speed = d;
    Remember = e;
    log = f; log.logs = []; // clear logs
    Merch = g;
}

function setAccConfig(config) {
    AccConfig = config;
}

function getAccConfig() {
    return AccConfig;
}

function pauseCurUpload(upload_id) {
    uploadPause = upload_id;
}

async function killChrome() {
    let kill_all = false;
    let count = 0;
    ps.lookup({
        command: 'chrome',
        }, function(err, resultList ) {
        if (err) {
            throw new Error( err );
        }

        if (resultList.length == 0) {
            kill_all = true;
        }

        count = resultList.length;
        resultList.forEach(function( process ){
                if( process && count > 0){
                    // console.log( 'PID: %s, COMMAND: %s, ARGUMENTS: %s', process.pid, process.command, process.arguments );

                    ps.kill( process.pid, 'SIGKILL', function( err ) {
                        if (err) {
                        }
                        else {
                            console.log( 'Process %s has been killed without a clean-up!', process.pid );
                        }
                    });

                    count--;
                    if (count == 0) {
                        console.log('killed all process');
                        kill_all = true;
                    }
                }
        }) 
    });

    while (!kill_all) {
        await botSleep(1);
    }
}

async function chromeProcess() {
    let chromeprocess = true;
    let waiting = true;
    let _timeout = 10;
    let exceptionList = ['Chrome Remote Desktop'];

    try {
        ps.lookup({
            command: 'chrome',
            }, function(err, resultList ) {

            console.log('err', err);
            console.log('resultList', resultList);
            // 

            waiting = false;

            let pscount = resultList.length;

            if (pscount > 0) {
                for(let p of resultList) {
                    console.log('check', p);
                    for (let p_except of exceptionList) {
                        console.log('p_except', p_except);
                        if (p.command.indexOf(p_except) != -1) {
                            pscount--;
                            break;
                        }
                    }
                }
            }

            if (pscount == 0) {
                console.log('no chrome process');
                chromeprocess = false;
            }

            if (err) {
                throw new Error( err );
            }
        });
    } catch (error) {
        console.log(error);
    }

    while (waiting && _timeout > 0) {
        await botSleep(1);
        _timeout--;
    }

    if (_timeout == 0) {
        chromeProcess = false; // force running chrome
    }

    return chromeprocess;
}

async function openChrome(executablePath, port, dataDir, profileFolder) {
    var parameters = [
        "--remote-debugging-port=" + port,
        "--user-data-dir=" + dataDir,
        "--profile-directory=" + profileFolder,
    ];

    // var options = { "web-preferences": { "page-visibility": true } };

    var newProcess = child.execFile(executablePath, parameters, function(err, data) {
        console.log('newProcess', err);
    });
}

async function botOpenChrome(accTpl) { //open chrome with params
    if (accTpl != null) {
        try {
            // kill Chrome before open the new one
            mLog(null, true, "Checking chrome process...");

            await killChrome();
            await botSleep(1);

            const chromePort = '9779';
            mLog(null, true, "Open chrome on port " + chromePort);
            mLog(null, true, "Take some seconds... ");

            let connectedChrome = false;
            while (!connectedChrome) {
                try {
                    if ((await chromeProcess() == false)) {
                        console.log('open normal chrome');
                        await openChrome(GExePath, chromePort, accTpl.dataDir, accTpl.profilePath);
                        connectedChrome = true;
                    }

                    if (!connectedChrome) {
                        await botSleep(2);
                    } else {
                        let getVersion = false;
                        let getVerTimeout = 5;
                        while (!getVersion && getVerTimeout > 0) {
                            try {
                                const response = await axios.get('http://localhost:'+ chromePort +'/json/version');
                                getVersion = true;
                            } catch {
                                await botSleep(1);
                            }
                        }

                        getVerTimeout--;
                    }
                } catch {
                }
            }

            const response = await axios.get('http://localhost:'+ chromePort +'/json/version');
            const { webSocketDebuggerUrl } = response.data;
            let browser = await puppeteer.connect({ 
                browserWSEndpoint: webSocketDebuggerUrl,
                ignoreHTTPSErrors: true,
                defaultViewport: null,
                slowMo: Speed,
                ignoreDefaultArgs: ["--enable-automation"]
            });

            const [page] = await browser.pages();

            return {browser, page};
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    return false;
}


async function botPage(page, selector, url, pageName, _timeout) {
    await page.goto(url).then(async() => {
        await page.waitForSelector(selector, {timeout: _timeout}).then(async() => {
            mLog(null, true, "Load "+ pageName +" success");
            await botSleep(1);
        }).catch((error) => {
            return Promise.reject("TIMEOUT");
        });
    }).catch((error) => {
        if (error == "TIMEOUT") {
            // log.logs.push({status: false, text: "Wait for element "+ pageName +" failed"});
        } else {
            mLog(null, false, "Load "+ pageName +" failed");
        }
    });
}

async function waitForPageload(page, selector, _timeout) {
    await page.waitForSelector(selector, {timeout: _timeout}).then(async() => {
        console.log('Waitforpage success', selector);
        await botSleep(1);
    }).catch(() => {
        console.log('Waitforpage failed', selector);
    });
}

async function clickOrPage(page, selClick, url, selWaitfor, pageName, _timeout) {
    await botClick(selClick, page).then(async() => {
        console.log('click or page: click');
        await waitForPageload(page, selWaitfor, _timeout);
    }).catch(async() => {
        console.log('click or page: page');
        await botPage(page, selWaitfor, url, pageName, _timeout);
    });

    await botPageNotLoad(page, selWaitfor);
}

async function botLogin(accTpl) {
    let chrome = await botOpenChrome(accTpl);
    let browser = chrome.browser;
    let page = chrome.page;
    let loggedIn = false;

    if (page) {
        mLog(accTpl.id, true, "Opened Chrome success", true);

        // open dashboad page
        await botPage(page, logginPageSel, PageBookShelf, "BookShelf Page", tout60);

        // check page logged in
        if (await isPageLoggedIn(page)) {
            loggedIn = true;
        } else {
            loggedIn = await tryLogin(page, logginPageSel, accTpl, KDPPageSel);
        }

        if (loggedIn) {
            return Promise.resolve(chrome);
        } else {
            await botSleep(1);
            browser.close();
            return Promise.reject();
        }
    } else {
        mLog(accTpl.id, false, "Open chrome failed!", true);
        mLog(accTpl.id, false, "Close all chrome application on task manager before start.", true);

        await botSleep(1);
        browser.close();
        return Promise.reject();
    }
}

async function tryLogin(page, loginSel, account, goalSel) {
    let loggedIn = false;
    let loginTimeout = 3; 

    try {
        await botPageNotLoad(page, loginSel); 

        await fillLogin(page, account.email, account.pass);

        while (loginTimeout >= 1 && !loggedIn) {
            console.log('wait for login success');
            await page.waitForSelector(goalSel, {timeout: 60000}).then(async() => {
                if (await isPageLoggedIn(page)) {
                    loggedIn = true;
                }
            }).catch(async(error) => {
                if (loginTimeout > 1) {
                    // console.log(error);
                    try {
                        await botPageNotLoad(page, loginSel);
                        console.log('login again');
                        botSleep(1);
                        await fillLogin(page, account.email, account.pass); 
                    } catch {
                        console.log('loginTimeout = 0');
                        loginTimeout = 0;
                    }
                }
            })

            loginTimeout--;
        }
    } catch (error) {
        console.log(error);
    }

    return loggedIn;
}

async function botUpload(account_id) {
    let accTpl = getAccConfig();

    mLog(accTpl.id, true, "Start upload process for account name: " + accTpl.name, true);

    let uploadInfos = await ApiFuns.getUploadInfos(account_id);
    if (uploadInfos) {
        let data = JSON.parse(uploadInfos);
        console.log(data);
        
        if (data.data.config.status == "1") { // TEST
            // login
            await botLogin(accTpl).then(async(chrome) => {
                let browser = chrome.browser;
                let page = chrome.page;
                mLog(accTpl.id, true, "Logged in success!", true);
                
                let kdp_type = 'EBOOK';
                let u_config = data.data.config;
                try {
                    if (parseInt(ImgUploadTout) <= 120) {
                        u_config.uploadTimeout = parseInt(ImgUploadTout);
                    } else {
                        u_config.uploadTimeout = 30; // default
                    }
                } catch {
                    u_config.uploadTimeout = 30; // default
                }

                // 
                try {
                    if (u_config.print_options.paperback_status) {
                        kdp_type = 'PPB';
                    }
                } catch {}

                //
                let success_array = data.data.upload.success;
                let account_name = data.data.name;

                // check .xlsx file
                let path_file = u_config.path_file.replace(/\\/g,"/");
                let excelName = localStorage.getItem("UploadDataName") === null ? 'data' : localStorage.getItem("UploadDataName");
                let excelFile = path_file + '/' + excelName + '.xlsx';

                try {
                    if (fs.existsSync(excelFile)) {
                        // start read excel file
                        await readData(excelFile).then(async(data) => {
                            console.log('excel data', data);
                            if (data.length > 0) {
                                mLog(accTpl.id, true, "Upload " + data.length + " designs for " + account_name, true);

                                // init configures
                                let upload_status = {
                                    upload: false, // success or failed
                                    message: null,
                                    stop: false
                                }

                                for(let i = 0; i < data.length; i++) {
                                    let designOrder = i + 1;

                                    if (!upload_status.stop && (uploadPause != account_id)) { // force stop
                                        if(!isInArray(designOrder, success_array)) { // if is not in success array
                                            mLog(accTpl.id, true, "Start upload design " + designOrder, true);

                                            try {
                                                // if upload a ebook
                                                console.log('u_config', u_config);
                                                if (kdp_type == "EBOOK") {
                                                    upload_status = await botUploadEbook(page, upload_status, u_config, path_file, data[i], log, accTpl);
                                                } else if (kdp_type == 'PPB') {
                                                    upload_status = await botUploadPPB(page, upload_status, u_config, path_file, data[i], log, accTpl);
                                                }
                                                console.log('upload_status', upload_status);

                                                // update to api
                                                if (upload_status.upload) { // if upload success
                                                    success_array.push(designOrder); 

                                                    let dataUploadObj = {
                                                        account_id: account_id,
                                                        data: JSON.stringify(success_array),
                                                        length: data.length
                                                    };

                                                    try {
                                                        await ApiFuns.uploadSuccess(dataUploadObj);
                                                        mLog(null, true, "Upload design " + designOrder + " success.");
                                                    } catch {
                                                        mLog(null, false, "Failed to push success upload list to api.");
                                                    }
                                                } else { // if upload failed
                                                    let errorObj = {number: designOrder, err_msg: upload_status.message};

                                                    let dataUploadObj = {
                                                        account_id: account_id,
                                                        data: JSON.stringify(errorObj)
                                                    };

                                                    try {
                                                        await ApiFuns.uploadError(dataUploadObj);
                                                        mLog(null, false, upload_status.message);
                                                        mLog(null, false, "Upload design " + designOrder + " failed.");
                                                    } catch {
                                                        mLog(null, false, "Failed to push success upload list to api.");
                                                    }
                                                }

                                                await botSleep(2);

                                                // if upload failed need to go to bookshelf page
                                                let bookshelfLink = ".kdp-header-links-column .a-link-normal";
                                                await botClick(bookshelfLink, page).then(async() => {
                                                    // await for
                                                    try {
                                                        let unsavedBtn = "#unsaved-changes-abandon-announce";
                                                        await page.waitForSelector(unsavedBtn, {timeout: 15000}).then(async() => {
                                                            await botSleep(1);
                                                            await botClick(unsavedBtn, page);
                                                        });
                                                    } catch {}
                                                }).catch(async() => {
                                                    await page.goto(PageBookShelf).then(async() => {})
                                                });
                                            } catch (error) {
                                                if (upload_status.message == null) {
                                                    mLog(accTpl.id, false, error.message, true);
                                                }
                                            }
                                        }
                                    } else {
                                        // if pause
                                        if (uploadPause) {
                                            upload_status.message = "User stoped current upload";
                                            uploadPause = 0; // reset pause
                                        }

                                        mLog(accTpl.id, false, upload_status.message, true);
                                        break;
                                    }
                                }
                            } else {
                                mLog(accTpl.id, false, "0 row found in excel file", true);
                            }
                        }).catch((error) => {
                            console.log(error);
                            mLog(accTpl.id, false, error.message, true);
                        });
                    }
                    else
                    {
                        mLog(accTpl.id, false, excelFile + " file not found", true);
                    }
                } catch(err) {
                    console.log(err);
                }

                await botSleep(1);
                browser.close();
            }).catch((error) => {
                console.log(error);
                mLog(accTpl.id, false, "Logged in failed!", true);
            });
        } else {
            mLog(null, false, "This account is not configured for upload. Please go to web manage to config your upload!");
        }
    } else {
        mLog(null, false, "Failed to load upload data from webservice.");
    }

    mLog(accTpl.id, true, "Upload process stop!", true);
}

async function botCheckSale(account_id) {
    let accTpl = getAccConfig();

    mLog(accTpl.id, true, "Start checksale process for account name: " + accTpl.name, true);

    // login
    await botLogin(accTpl).then(async(chrome) => {
        let page = chrome.page;
        let browser = chrome.browser;
        mLog(accTpl.id, true, "Logged in success!", true);
        mLog(accTpl.id, true, "Start checksale...", true);

        try {
            // click reports link
            let reportLink = await getSelector(page, '.kdp-header-links-column .a-link-normal', 1);
            try{
                await reportLink.click();
            } catch {
                await page.goto(PageReport).then(async() => {})
            };

            //
            let dataObj = {
                account_id: account_id
            };

            // normal checksale
            let account_data = await SaleFuncs.normalCheck(browser, page, accTpl);
            dataObj.data = JSON.stringify(account_data);
            // dataObj.data = '{"Order":{"Today":"2","Last7days":"0","Last30days":"0","Last90days":"0"},"KenpRead":{"Today":"2000","Last7days":"0","Last30days":"0","Last90days":"0"},"Royalties":{"Today":"$1.75*","ThisMonth":"$1.00<span>*</span>","LastMonth":"$10.00<span>*</span>"},"Date":"2020-04-13"}';
            // console.log(dataObj);

            // console.log(dataObj);// 
            let pushSaleReturn = await ApiFuns.pushSales(dataObj);
        } catch (error) {
            console.log(error);
            mLog(accTpl.id, false, error.message, true);
        }

        await botSleep(1);
        browser.close();
    }).catch((error) => {
        console.log(error);
        mLog(accTpl.id, false, "Logged in failed!", true);
    });

    mLog(accTpl.id, true, "Checksale process stop!", true);
}

async function unpublishKdp(account_id) {
    let accTpl = getAccConfig();

    mLog(accTpl.id, true, "Start unpublish kdp for account name: " + accTpl.name, true);

    // login
    await botLogin(accTpl).then(async(chrome) => {
        let page = chrome.page;
        let browser = chrome.browser;
        mLog(accTpl.id, true, "Logged in success!", true);

        try {
            await UnpublishFuncs.kdp(browser, page, accTpl);

            mLog(accTpl.id, true, "Unpublish kdp has done.", true);
        } catch(error) {
            console.log(error);
            mLog(accTpl.id, false, error.message, true);
        }

        await botSleep(1);
        browser.close();
    }).catch((error) => {
        console.log(error);
        mLog(accTpl.id, false, "Logged in failed!", true);
    });

    mLog(accTpl.id, true, "Unpublish kdp process stop!", true);
}

async function botTest(account_id) {
    console.log('connect chrome');
    let chrome = await connectCurChrome();
    let page = chrome.page;

    let accTpl = getAccConfig();
    console.log(accTpl);

    let uploadInfos = await ApiFuns.getUploadInfos(account_id);
    let u_config = JSON.parse(uploadInfos);
    console.log(u_config);

    await botSleep(2000);

    // choose age range // data-reading-interest-age-start-input
    let age_range = u_config.data.config.age_children;
    console.log(age_range);
    if (age_range != "0") {
        // click minimum selectbox
        await botClick("#data-reading-interest-age-start-input span span", page);
        await botSleep(1);

        // click selection
        let selectSel = "#data-reading-interest-age-start-input-native_" + (parseInt(age_range) + 1);
        await botClick(selectSel, page);

        if (age_range != "18") { // select maximum
            await botSleep(1);

            await botClick("#data-reading-interest-age-end-input span span", page);
            await botSleep(1);

            // click 18+ selection
            if (age_range == "13") {
                await botClick("#data-reading-interest-age-end-input-native_6", page);
            }

            if (age_range == "16") {
                await botClick("#data-reading-interest-age-end-input-native_3", page);
            }
        }
    }
}

async function connectCurChrome() {
    const chromePort = '9379';
    const response = await axios.get('http://localhost:'+ chromePort +'/json/version');
    const { webSocketDebuggerUrl } = response.data;
    console.log(webSocketDebuggerUrl);
    let browser = await puppeteer.connect({ 
        browserWSEndpoint: webSocketDebuggerUrl,
        ignoreHTTPSErrors: true,
        defaultViewport: null,
        // slowMo: Speed,
        ignoreDefaultArgs: ["--enable-automation"]
    });

    const [page] = await browser.pages();

    return {page: page, browser: browser};
}

async function readData(excelFile) {
    var workbook = new ExcelJS.Workbook();
    return await workbook.xlsx.readFile(excelFile)
    .then(function() {
        var worksheet = workbook.getWorksheet(1);
        var array = [];
        worksheet.eachRow({ includeEmpty: false }, function(row, rowNumber) {
            (rowNumber > 1) && (row.getCell(1).text != null) &&
            (
                array.push([
                    row.getCell(1).text,
                    row.getCell(2).text,
                    row.getCell(3).text,
                    row.getCell(4).text,
                    row.getCell(5).text,
                    row.getCell(6).text,
                    row.getCell(7).text,
                    row.getCell(8).text,
                    row.getCell(9).text,
                    row.getCell(10).text,
                    row.getCell(11).text
                ])
            )
        });
        
        return Promise.resolve(array);
    }).catch(()=>{
        return Promise.reject('Cannot read file: ' + excelFile);
    });
    
}

function getDdlTypes() {
    let ddlTypes = {
        "standard": {
            class: "STANDARD_TSHIRT",
            market: "ddlStandardMarket",
            editbtn: ".STANDARD_TSHIRT-edit-btn",
            color: "colors_standard",
            price: "standard_",
            uploadbtn: "STANDARD_TSHIRT-"
        }, 
        "premium": {
            class: "PREMIUM_TSHIRT",
            market: "ddlPremiumMarket",
            editbtn: ".PREMIUM_TSHIRT-edit-btn",
            color: "colors_premium",
            price: "premium_",
            uploadbtn: "PREMIUM_TSHIRT-"
        },
        "v-neck": {
            class: "VNECK",
            market: "ddlVneckMarket",
            editbtn: ".VNECK-edit-btn",
            color: "colors_v_neck",
            price: "v_neck_",
            uploadbtn: "VNECK-"
        },
        "tank-top": {
            class: "TANK_TOP",
            market: "ddlTanktopMarket",
            editbtn: ".TANK_TOP-edit-btn",
            color: "colors_tank_top",
            price: "tank_top_",
            uploadbtn: "TANK_TOP-"
        },
        "longsleeve": {
            class: "STANDARD_LONG_SLEEVE",
            market: "ddlLongsleeveMarket",
            editbtn: ".STANDARD_LONG_SLEEVE-edit-btn",
            color: "colors_longsleeve",
            price: "longsleeve_",
            uploadbtn: "STANDARD_LONG_SLEEVE-"
        },
        "raglan": {
            class: "RAGLAN",
            market: "ddlRaglanMarket",
            editbtn: ".RAGLAN-edit-btn",
            color: "colors_raglan",
            price: "raglan_",
            uploadbtn: "RAGLAN-"
        },
        "sweatshirt": {
            class: "STANDARD_SWEATSHIRT",
            market: "ddlSweatshirtMarket",
            editbtn: ".STANDARD_SWEATSHIRT-edit-btn",
            color: "colors_sweatshirt",
            price: "sweatshirt_",
            uploadbtn: "STANDARD_SWEATSHIRT-"
        },
        "pullover-hoodie": {
            class: "STANDARD_PULLOVER_HOODIE",
            market: "ddlPulloverHoodieMarket",
            editbtn: ".STANDARD_PULLOVER_HOODIE-edit-btn",
            color: "colors_pullover_hoodie",
            price: "pullover_hoodie_",
            uploadbtn: "STANDARD_PULLOVER_HOODIE-"
        },
        "zip-hoodie": {
            class: "ZIP_HOODIE",
            market: "ddlZipHoodieMarket",
            editbtn: ".ZIP_HOODIE-edit-btn",
            color: "colors_zip_hoodie",
            price: "zip_hoodie_",
            uploadbtn: "ZIP_HOODIE-"
        },
        "popshockets": {
            class: "POP_SOCKET",
            market: "ddlPopshocketsMarket",
            editbtn: ".POP_SOCKET-edit-btn",
            color: null,
            price: "popshockets_",
            uploadbtn: "POP_SOCKET-"
        }
    };

    return ddlTypes;
}

/* ------ ||||||| -------- */
/* General Functions */
function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low)
}

function isInArray(value, array) {
  return array.indexOf(value) > -1;
}

function mLog(account_id, status, message, emit = false) {
    // add logs
    log.logs.push({status: status, text: message});

    // if allow push logs to server
    if (emit) {
        let _status = (status) ? 1 : 0;

        Merch.emit('UploadLogs:Save',{
            account_id : account_id,
            message : message,
            status : _status
        });
    }
}

function clearLog(account_id) {
    Merch.emit('UploadLogs:Clear',{
        account_id : account_id
    });
}

module.exports = {
    botInit, setAccConfig, botUpload, pauseCurUpload, botCheckSale, unpublishKdp, botTest, mLog
}