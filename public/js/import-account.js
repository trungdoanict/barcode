const $ = require('jquery');
const ExcelJS = require('exceljs');

const { ipcRenderer } = require('electron');
const config = require('./../../config.js');

const { encryptStringWithRsaPublicKey, decryptStringWithRsaPrivateKey } = require('./encryption');

const DB = require('./db.js');
const AccountTable = new DB('kdb_account');


async function readData(excelFile,callback) {
    let wb = new ExcelJS.Workbook();
    let reader = new FileReader();
    let array = [];
    reader.readAsArrayBuffer(excelFile)
    reader.onload = () => {
        let buffer = reader.result;
        wb.xlsx.load(buffer).then(workbook => {
            workbook.eachSheet((sheet, id) => {
                sheet.eachRow((row, rowIndex) => {
                   
                    if (rowIndex > 1){
                        array.push([
                            row.getCell(1).value ? (row.getCell(1).value.text ? row.getCell(1).value.text : row.getCell(1).value) : '',
                            row.getCell(2).value ? (row.getCell(2).value.text ? row.getCell(2).value.text : row.getCell(2).value) : '',
                            row.getCell(3).value ? (row.getCell(3).value.text ? row.getCell(3).value.text : row.getCell(3).value) : '',
                            row.getCell(4).value ? (row.getCell(4).value.text ? row.getCell(4).value.text : row.getCell(4).value) : '',
                            row.getCell(5).value ? (row.getCell(5).value.text ? row.getCell(5).value.text : row.getCell(5).value) : ''
                        ]);
                    }
                })

                callback(array)
            })
        })
    }
}

async function Save_DB(data, id_local){
    return await new Promise(async (resolve) =>{
       $.ajax({
            url : config.host+"/account/create-account",
            type : "post",
            dataType:"text",
            data : {
                'name' : data[0],
                'email' : data[1],
                'codeid' : localStorage.getItem('codeid'),
                'auto_checksale' : data[3],
                'id' : id_local
            },
            success : function (result){
                resolve({'status' : true, message: 'Import success'});
            },
            error : function (error){
                AccountTable.deleteRow({
                    'email' : data[1]
                },function(result,data){
                    resolve({'status' : false, message: $.parseJSON(error.responseText).message});
                })
            }
        });
    })
}

async function Save_Local(data){
    return await new Promise(async (resolve) =>{
        
        var name = data[0];
        var email = data[1];
        var password = data[2];
        var auto_checksale = data[3] == 'yes' ? 1 : 0;
        var profile_path = data[4];
        
        if (name == '')
        {
            resolve({'status' : false, message: 'Invalid  Name.'})
        }
        if (email == '')
        {
            resolve({'status' : false, message: 'Invalid  Email.'})
        }
        
        if (password == '')
        {
            resolve({'status' : false, message: 'Invalid  Password.'})
        }
        if (profile_path == '')
        {
            resolve({'status' : false, message: 'Invalid  Profile Path.'})
        }
        
        AccountTable.insert({
            'email' : email.toString(),
            'name' : name.toString(),
            'password' : encryptStringWithRsaPublicKey(password.toString()).toString(),
            'profile_path' : profile_path.toString(),
            'status_upload' : 0,
            'status_checksale' : 0,
            'status_editdesign' : 0,
            'auto_checksale' : auto_checksale.toString()
        },function(result,data){
            if(result){
                resolve({'status' : true, message: 'Save Local Success.', id_local : data.id})
            }
            else
            {
                resolve({'status' : false, message: data})
            }
        })
        
    })
}

async function ImportAccount(logVuejs, appVuejs){
    var fileUpload = document.getElementById('import_account');
    var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.xls|.xlsx)$/;
    if (regex.test(fileUpload.value.toLowerCase())) {
        await readData(fileUpload.files[0],async function(data){
            
            for (var i = 0; i < data.length; i++) {

                var save_local = await Save_Local(data[i]);
                console.log(save_local,'save_local');
                if (save_local.status){
                    var save_server = await Save_DB(data[i], save_local.id_local);
                    console.log(save_server,'save_server');
                    if (save_server.status){

                        appVuejs.list_account.push({
                            "email": data[i][1],
                            "password": encryptStringWithRsaPublicKey(data[i][2].toString()).toString(),
                            "name": data[i][0],
                            "profile_path": data[i][4],
                            "auto_checksale": data[i][3],
                            "id": save_local.id_local,
                            "status_upload" : 0,
                            "status_checksale" : 0,
                            "status_editdesign" : 0
                        })

                        
                        logVuejs.logs.push({status: save_server.status, text: 'Account: '+ data[i][1]+' Import account success' });
                    }else{
                        logVuejs.logs.push({status: save_server.status, text: 'Account: '+ data[i][1]+' '+save_server.message});
                    }
                    
                }else{

                    logVuejs.logs.push({status: save_local.status, text: 'Account: '+ data[i][1]+' '+save_local.message});
                }
            }
        });
    }else{
        alert("Please upload a valid Excel file.");
    }
}


module.exports = {
    ImportAccount
}