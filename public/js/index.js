const {
    ipcRenderer
} = require('electron');
const { generateMixedBarcode } = require('./functions');
const $ = require('jquery');


console.log(generateMixedBarcode());

const DB = require('./db.js');
const AccountTable = new DB('kdb_account');


const version = document.getElementById('version');
const notification = document.getElementById('notification');
const message = document.getElementById('message');
const restartButton = document.getElementById('restart-button');

ipcRenderer.send('app_version');
ipcRenderer.on('app_version', (event, arg) => {
    ipcRenderer.removeAllListeners('app_version');
    version.innerText = 'Version ' + arg.version;
});

ipcRenderer.on('update_available', () => {
    ipcRenderer.removeAllListeners('update_available');
    message.innerText = 'A new update is available. Downloading now...';
    notification.classList.remove('hidden');
    console.log('update_available');
});

ipcRenderer.on('update_downloaded', () => {
    ipcRenderer.removeAllListeners('update_downloaded');
    message.innerText = 'Update Downloaded. It will be installed on restart. Restart now?';
    restartButton.classList.remove('hidden');
    notification.classList.remove('hidden');
    console.log('update_downloaded');
});

ipcRenderer.on('update_app_event', () => {
    console.log('update');
});

ipcRenderer.on('error_update', (error) => {
    console.log('update error',error);
});

ipcRenderer.on('update-not-available', () => {
    var notifcation_infos = {
        'type' : 'info',
        'title' : 'Notification',
        'message' : 'Your version is the latest!',
        'detail' : ''
    }
    ipcRenderer.send('show_dialog',notifcation_infos)
    console.log('Latest version');
});

ipcRenderer.on('download-progress', function(event, data) {
    const percent = parseFloat(data.percent).toFixed(2);
    $('.prosess-item').css({
        'width': percent + '%'
    });

});

$('#update-version').on('click',function(){
	ipcRenderer.send('update_app_event');
})
$('#restart-button-app').on('click',function(){
	ipcRenderer.send('restart_app');
})
$('#close-button-notification').on('click',function(){
	notification.classList.add('hidden');
})
$('#modal_create_account').on('click',function(){
	ipcRenderer.send('show_modal_create_account');
})
$('#config_form button').on('click',function(){
	var url = $('#config_form input[name="pathchrome"]').val();
    // var auto_checksale = $('#config_form input[name="auto_checksale"]').val();
  	localStorage.setItem("ExecutablePath", url);
    // localStorage.setItem("AutoChecksale", auto_checksale);

    // save use remember account
    var useRememberPassword = document.getElementById("useRememberPassword");
    if (useRememberPassword.checked) {
        localStorage.setItem("UseRememberAccount", "YES");
    } else {
        localStorage.setItem("UseRememberAccount", "NO");
    }

    // save excel file name
    var excelFileName = $('#config_form input[name="uploaddataname"]').val();
    localStorage.setItem("UploadDataName", excelFileName);

    // save bot speed
    var botSpeed = $('#config_form input[name="botspeed"]').val();
    botSpeed = parseInt(botSpeed);
    if (20 <= botSpeed && botSpeed <= 120) {
        localStorage.setItem("BotSpeed", botSpeed);
    } else {
        ('#config_form input[name="botspeed"]').val(localStorage.getItem("BotSpeed"));
    }

    // save upload timeout
    var lsUploadTimeout = $('#config_form input[name="uploadtimeout"]').val();
    lsUploadTimeout = parseInt(lsUploadTimeout);
    if (1 <= lsUploadTimeout && lsUploadTimeout <= 120) {
        localStorage.setItem("UploadTimeout", lsUploadTimeout);
    } else {
        ('#config_form input[name="uploadtimeout"]').val(localStorage.getItem("UploadTimeout"));
    }

    // save reupload timer
    var reuploadTimer = $('#config_form input[name="reuploadTimer"]').val();
    reuploadTimer = parseInt(reuploadTimer);
    if (1 <= reuploadTimer && reuploadTimer <= 20) {
        localStorage.setItem("reuploadTimer", reuploadTimer);
    } else {
        ('#config_form input[name="reuploadTimer"]').val(localStorage.getItem("reuploadTimer"));
    }

    var codeid = localStorage.getItem('codeid');
    // update_date_auto_sale(codeid, auto_checksale);

    var notifcation_infos = {
        'type' : 'info',
        'title' : 'Notification',
        'message' : 'Update Config Successfully!',
        'detail' : ''
    }
    ipcRenderer.send('show_dialog',notifcation_infos)

  	return false;
})

var appVuejs = new Vue({
    el: '#aplication',
    data: {
        list_account: []
    },
    methods: {
        
    },
    computed : {
        
    }
})

var logVuejs = new Vue({
    el: '#console-log',
    data: {
        logs: []
    },
    methods: {
        
    },
    computed : {
        
    }
})

