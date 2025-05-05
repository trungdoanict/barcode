const {
    ipcRenderer
} = require('electron');
const $ = require('jquery');
var fs = require('fs'); 

let list_tasks = [];
let status_process = false;

const T_CHECKSALE = 'C';
const T_UPLOAD = 'U';
// const T_DESIGN = 'D';
// const T_LISTING = 'L';
const T_UNP_KDP = 'UNK'



const DB = require('./db.js');
const AccountTable = new DB('kdb_account');


const version = document.getElementById('version');
const notification = document.getElementById('notification');
const message = document.getElementById('message');
const restartButton = document.getElementById('restart-button');

if (localStorage.getItem("ExecutablePath") === null) {
	var url = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  	localStorage.setItem("ExecutablePath", url);
    // localStorage.setItem("AutoChecksale", '00:00');
  	$('#config_form input[name="pathchrome"]').val(url);
}
else
{
	var url = localStorage.getItem('ExecutablePath');
  	$('#config_form input[name="pathchrome"]').val(url);
}

if (localStorage.getItem("UseRememberAccount") == "YES") {
    document.getElementById("useRememberPassword").checked = true;
}

if (localStorage.getItem("UploadDataName") === null) {
    localStorage.setItem("UploadDataName", "data");
}$('#config_form input[name="uploaddataname"]').val(localStorage.getItem("UploadDataName"));

if (localStorage.getItem("BotSpeed") === null) {
    localStorage.setItem("BotSpeed", 70);
}$('#config_form input[name="botspeed"]').val(localStorage.getItem("BotSpeed"));

if (localStorage.getItem("UploadTimeout") === null) {
    localStorage.setItem("UploadTimeout", 30);
}$('#config_form input[name="uploadtimeout"]').val(localStorage.getItem("UploadTimeout"));

if (localStorage.getItem("reuploadTimer") === null) {
    localStorage.setItem("reuploadTimer", 7);
}$('#config_form input[name="reuploadTimer"]').val(localStorage.getItem("reuploadTimer"));

ipcRenderer.send('app_version');
ipcRenderer.on('app_version', (event, arg) => {
    ipcRenderer.removeAllListeners('app_version');
    version.innerText = 'Version ' + arg.version;
});

ipcRenderer.on('KDP', (event, arg) => {
    localStorage.setItem("KDP", arg);
    if (localStorage.getItem("ExecutablePath") === null) {
        localStorage.setItem("ExecutablePath", 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe');
        // localStorage.setItem("AutoChecksale", '00:00');
    }
});


ipcRenderer.on('RemovelocalStorage', () => {
    localStorage.clear();
});

ipcRenderer.on('update_available', () => {
    ipcRenderer.removeAllListeners('update_available');
    message.innerText = 'A new update is available. Downloading now...';
    notification.classList.remove('hidden');
    socket.emit('Code:UpdateApplicationAvailable', localStorage.getItem('codeid'));
    console.log('update_available');
});

ipcRenderer.on('update_downloaded', () => {
    ipcRenderer.removeAllListeners('update_downloaded');
    message.innerText = 'Update Downloaded. It will be installed on restart. Restart now?';
    restartButton.classList.remove('hidden');
    notification.classList.remove('hidden');
    socket.emit('Code:UpdateApplicationComplete', localStorage.getItem('codeid'));
    console.log('update_downloaded');
});

ipcRenderer.on('update_app_event', () => {
    console.log('update');
    //socket.emit('Code:UpdateApplicationProcessing', localStorage.getItem('codeid'));
});

ipcRenderer.on('error_update', (error) => {
    console.log('update error',error);
});

ipcRenderer.on('update-not-available', () => {
    console.log('Latest version');
});

ipcRenderer.on('set_code_id', function(event, data) {
    localStorage.setItem("codeid", data);
    check_code_active(data);
    socket.emit('Tool:Online', data);
    //load_list_account();
});

ipcRenderer.on('download-progress', function(event, data) {
    const percent = parseFloat(data.percent).toFixed(2);
    $('.prosess-item').css({
        'width': percent + '%'
    });
    socket.emit('Code:UpdateApplicationPercent', {
        'codeid' : localStorage.getItem('codeid'),
        'percent' : percent
    });

    if (parseInt(percent) == 100)
    {
        socket.emit('Code:UpdateApplicationComplete', localStorage.getItem('codeid'));
    }
});

ipcRenderer.on('reload_list_account', function(event, data) {
    appVuejs.list_account.push({
        "email": data.email,
        "password": data.password,
        "name": data.name,
        "profile_path": data.profile_path,
        "auto_checksale": data.auto_checksale,
        "id": data.id,
        "name" : data.name,
        "status_upload" : data.status_upload,
        "status_checksale" : data.status_checksale,
        "status_editdesign" : data.status_editdesign
    })
});

ipcRenderer.on('reload_edit_account', function(event, dataObj) {
    for(let i = 0; i < appVuejs.list_account.length; i++) {
        if (appVuejs.list_account[i].id == dataObj.id) {
            // do something here
            appVuejs.list_account[i].password = dataObj.password;
            appVuejs.list_account[i].profile_path = dataObj.profile_path;

            break;
        }
    }
});

ipcRenderer.on('reset_edit_btn', function(event){
    appVuejs.edit_id = '';
});

$('#show-log-btn').on('click', function(){
    $('#config-box').removeClass('config-full');
    $('.console-log').show();
    $('#hide-log-btn').show();
    $('#show-log-btn').hide();
})

$('#hide-log-btn').on('click', function(){
    $('#config-box').addClass('config-full');
    $('.console-log').hide();
    $('#show-log-btn').show();
    $('#hide-log-btn').hide();
})

$('#update-version').on('click',function(){
	ipcRenderer.send('update_app_event');
    notification.classList.remove('hidden');
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

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low)
}

async function teeSleep(volume = 1) {
    let r = randomInt(2000, 4000)
    switch (volume) {
        case 2: r = randomInt(5000, 8000); break;
        case 3: r = randomInt(2*60000, 3*60000); break;
        case 4: r = randomInt(40000, 60000); break;
        case 5: r = randomInt(10000, 20000); break;
    }

    return new Promise((resolve) => {
        setTimeout(() => resolve(r), r)
    })
}

function check_code_active(codeid) {
    $.ajax({
        url: config.host+"/code/check-code",
        type: "post",
        dataType: "text",
        data: {
            'codeid': codeid,
        },
        success: function(result) {
        	var data = $.parseJSON(result);

        	if (parseInt(data.status) == 0)
        	{
        		ipcRenderer.send('code_active_fail');
        	}
            else
            {
                localStorage.setItem("userId", data.userId);
            }
        },
        error: function(error) {
            var data_send = {
	            'type': 'error',
	            'title': 'Notification',
	            'message': 'No network connection.',
	            'detail': ''
	        }
	        ipcRenderer.send('show_dialog', data_send);
        }
    });
}

function update_version(codeid, version) {
    $.ajax({
        url: config.host+"/code/update-version-code",
        type: "post",
        dataType: "text",
        data: {
            'codeid': codeid,
            'version': version
        },
        success: function(result) {

        },
        error: function(error) {}
    });
}

function isInArray(value, type, array) {
    return array.find(o => (o.id == value && o.type == type) )
}

function changeVueStatus(type, id, process) {
    let account_infos = null;
    for(let i = 0; i < appVuejs.list_account.length; i++) {
        if (appVuejs.list_account[i].id == id) {
            switch (type) {
                case T_CHECKSALE: appVuejs.list_account[i].status_checksale = process; account_infos = appVuejs.list_account[i]; break;
                case T_UPLOAD: appVuejs.list_account[i].status_upload = process; account_infos = appVuejs.list_account[i]; break;
                case T_UNP_KDP: account_infos = appVuejs.list_account[i]; break;
            }

            break;
        }
    }

    return account_infos;
}

function push_task(task) { // action checksale / upload; account: {id, email, pass, profile}
    var codeid = localStorage.getItem('codeid');

    if (!isInArray(task.id, task.type, list_tasks)){
        list_tasks.push(task);

        changeVueStatus(task.type, task.id, 1);  // process = 1 -> inqueue

        // check schedule
        check_schedule();
    }
}

function check_schedule(){
    if (!status_process)
    {   
        status_process = true;
        run_schedule();
    }
}

async function run_schedule() {
    var i = 0;
    var codeid = localStorage.getItem('codeid');

    while(true) {
        let account_data = null;
        var current_task = list_tasks[i];

        // run task
        if (current_task.type == T_CHECKSALE) {
            socket.emit('PushCheckSale:Event', {
                'id': current_task.id,
                'codeid': codeid,
                'process': 2
            });
        }

        if (current_task.type == T_UPLOAD) {
            socket.emit('PushUpload:Event', {
                'id': current_task.id,
                'codeid': codeid,
                'process': 2
            });
        }

        /*if (current_task.type == T_DESIGN) {
            socket.emit('PushEditDesign:Event', {
                'id': current_task.id,
                'codeid': codeid,
                'process': 2
            });
        }

        if (current_task.type != T_LISTING) {
            account_data = changeVueStatus(current_task.type, current_task.id, 2); // change status to running
        } else {
            account_data = changeVueStatus(T_DESIGN, current_task.id, 3); // change status to listing
        }*/

        /* console.log('run task', current_task.id + ' ' + current_task.type);
        await teeSleep(5); */

        account_data = changeVueStatus(current_task.type, current_task.id, 2); // change status to running

        console.log('account_data', account_data);
        if (account_data != null) {
            console.log('current_task', current_task);
            switch (current_task.type) {
                case T_CHECKSALE: await taskCheckSale(account_data); break;
                case T_UPLOAD: await taskUpload(account_data); break;
                case T_UNP_KDP: await taskUnpublishKdp(account_data); break;
                // case T_LISTING: await taskListingDesigns(account_data); break;
                // case T_DESIGN: await taskEditDesign(account_data); break;
            }
        }

        // emit to webservice
        if (current_task.type == T_CHECKSALE) {
            console.log('checksale end');
            socket.emit('PushCheckSale:Event', {
                'id': current_task.id,
                'codeid' : codeid,
                'process': 0
            });
        }
        if (current_task.type == T_UPLOAD) {
            console.log('upload end');
            socket.emit('PushUpload:Event', {
                'id': current_task.id,
                'codeid' : codeid,
                'process': 0
            });
        }

        if (current_task.type == T_UNP_KDP) {
            console.log('unpublish kdp end');
            appVuejs.kdp_unpublish_id = '';
        }
        /*if (current_task.type == T_DESIGN) {
            console.log('edit design end');
            socket.emit('PushEditDesign:Event', {
                'id': current_task.id,
                'codeid' : codeid,
                'process': 0
            });
        }

        if (current_task.type == T_LISTING) {
            console.log('listing design end');
            socket.emit('PushListDesign:Event', {
                'id': current_task.id,
                'codeid' : codeid,
                'process': 0
            });
        }*/

        changeVueStatus(current_task.type, current_task.id, 0);

        // remove this complete task out of list tasks
        list_tasks.splice(i, 1);

        // if finish
        if (list_tasks.length == 0)
        {
            status_process = false;
            console.log('all tasks done!');
            break;
        } else {
            // sleep some minutes
            mLog(account_data.id, true, "Task finish, waiting 2-3 minutes to go to next task", true);
            await teeSleep(3);
        }
    }
}

async function taskCheckSale(account_data) {
    initBotSetup();
            
    // config bot account
    let config = getConfigFromData(account_data);

    setAccConfig(config);

    await botCheckSale(account_data.id);
}

async function taskUpload(account_data) {
    initBotSetup();
            
    // config bot account
    let config = getConfigFromData(account_data);

    setAccConfig(config);

    await botUpload(account_data.id); // TEST
    // await botTest(account_data.id);
}

async function taskUnpublishKdp(account_data) {
    initBotSetup();
            
    // config bot account
    let config = getConfigFromData(account_data);

    setAccConfig(config);

    await unpublishKdp(account_data.id);
}

/* ========== ||||||||| ============ */
let initBotSetup = function() {
    let executePath = localStorage.getItem("ExecutablePath").replace(/\\/g,"/");
    let locationPath = localStorage.getItem('KDP');
    let imgUploadTout = localStorage.getItem("UploadTimeout");
    let reuploadTimer = localStorage.getItem("reuploadTimer");
    let botSpeed = localStorage.getItem("BotSpeed");
    let rememberPass = localStorage.getItem("UseRememberAccount");
    botInit(executePath, locationPath, imgUploadTout, reuploadTimer, botSpeed, rememberPass, logVuejs, socket);
}

let getConfigFromData = function(data) {
    // config bot account
    let profilePath = data.profile_path.replace(/\\/g,"/").split("/");
    let datadir = '';
    for (var i = 0; i <  profilePath.length -1; i++) {
        datadir += profilePath[i]+'/';
    }

    let config = {
        id: data.id,
        email: data.email,
        pass: decryptStringWithRsaPrivateKey(data.password),
        dataDir: datadir,
        profilePath: profilePath[profilePath.length-1],
        name: data.name
    }

    return config;
}

var get_data_account = [];
AccountTable.getAll(function(result,data){
    if (result) {
        get_data_account = data;
    }
})

// unpublish timer
setInterval(function() {
    let sethour = $('#unpublish-hour').val();
    let setdate = $('#unpublish-date').val();

    let currentDateTime = new Date();
    
    if (setdate) {
        // compare date time
        let currentMonth = currentDateTime.getMonth() + 1;
        let currentTimeLabel = currentDateTime.getHours() + "" + currentDateTime.getFullYear() + '-' + (currentMonth < 10 ? '0' + currentMonth : currentMonth) + '-' + (currentDateTime.getDate() < 10 ? "0" + currentDateTime.getDate() : currentDateTime.getDate());
        let alarmLabel = sethour + setdate;

        console.log(currentTimeLabel);
        console.log(alarmLabel)

        if (currentTimeLabel == alarmLabel) {
            console.log('unpublish all account', appVuejs.list_account);
            for(let i = 0; i < appVuejs.list_account.length; i++) {
                appVuejs.kdp_unpublish(appVuejs.list_account[i]);
            }
        }
    }
}, 3600000)

var appVuejs = new Vue({
    el: '#aplication',
    data: {
        list_account: get_data_account,
        upload_id : '',
        checksale_id : '',
        remove_id : '',
        kdp_unpublish_id: '',
        editdesign_id : ''
    },
    methods: {
        edit_account: function(data) {
            this.edit_id = data.id;

            ipcRenderer.send('show_modal_edit_account', data);
        },
        remove_account: function (data) {
            if (confirm("Are you sure to delete")){
                appVuejs.remove_id = data.id;
                AccountTable.deleteRow({
                    'id' : data.id
                },function(result,datas){
                    
                    if(result == true)
                    {
                        $.ajax({
                            url: config.host + "/account/remove-account-by-id",
                            type: "post",
                            dataType: "text",
                            data: {
                                'id': data.id,
                                'codeid': localStorage.getItem('codeid')
                            },
                            success: function(result) {
                                appVuejs.list_account = appVuejs.list_account.filter(function(item, index, arr){
                                    return item.id != data.id;
                                });
                                appVuejs.remove_id = '';
                            }
                        })
                    }
                    else
                    {
                        appVuejs.remove_id = '';
                    }
                })
            }
        },
        upload: function (data) {
            // this.upload_id = data.id
            /*socket.emit('UploadLogs:Save',{
                account_id : data.id,
                message : "open chrome success",
                status : 1
            });*/
            let run_task = {id: data.id, type: T_UPLOAD, process: 2}; // process = 2 --> running
            push_task(run_task);
        },
        check_sales: function (data) {
            // this.checksale_id = data.id
            let run_task = {id: data.id, type: T_CHECKSALE, process: 2}; // process = 2 --> running
            push_task(run_task);
        },
        kdp_unpublish: function (data) {
            this.kdp_unpublish_id = data.id;
            let run_task = {id: data.id, type: T_UNP_KDP, process: 2}; // process = 2 --> running
            push_task(run_task);
        }
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

$('#import_account').on('change',async function(){
    ImportAccount(logVuejs, appVuejs)
})