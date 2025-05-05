const db = require('electron-db');
const path = require('path')
 
const location = localStorage.getItem('KDP')+'/db';
module.exports =   class  DB {
    constructor(table){
        this.table = table;
        db.createTable(table,location, (succ, msg) => {
            //console.log(succ, msg);
        })
    }
    insert(object,callback) {
        db.getRows(this.table,location,{'email' : object.email}, (succ, data) => {
            if (succ == true)
            {
                if (data.length == 0)
                {
                    db.insertTableContent(this.table,location, object, (succ, msg) => {
                        if (succ == true)
                        {
                            db.getRows(this.table,location,{}, (succ, data) => {
                                callback(succ,data[data.length-1]);
                            })
                        }
                        else
                        {
                            callback(succ,msg);
                        }
                    })
                }
                else
                {
                    callback(false,'Email already exists in the system');
                }
            }
            else
            {
                callback(succ,msg);
            }
        })
        
    }
    getAll(callback) {
        db.getAll(this.table,location, (succ, data) => {
            callback(succ,data);
        })
    }
    getRows(where_object,callback) {
        db.getRows(this.table,location,where_object, (succ, data) => {
            callback(succ,data);
        })
    }
    updateRow (where_object,set_object,callback) {
        db.updateRow(this.table,location,where_object,set_object, (succ, message) => {
            callback(succ,message);
        })
    }
    search_like(colume,value,callback) {
        db.search(this.table,location,colume,value, (succ, data) => {
            callback(succ,data);
        })
    }
    deleteRow(where_object,callback) {
        db.deleteRow(this.table,location,where_object, (succ, data) => {
            callback(succ,data);
        })
    }
    clearTable(callback) {
        db.clearTable(this.table,location, (succ, data) => {
            callback(succ,data);
        })
    }
    count(callback) {
        db.count(this.table,location, (succ, data) => {
            callback(succ,data);
        })
    }
}

/*insert('accounts',{
    "name": "Alexius Academia",
    "address": "Paco, Botolan, Zambales"
},function(result,message){
    console.log(result,message)
})*/
/*
getAll('accounts',function(result,data){
    console.log(result,data)
})*/

/*getRows('accounts',{
  address: "Paco, Botolan"
},function(result,data){
    console.log(result,data)
})
updateRow('accounts',{
  "id": 1581278326990
},{
  "address": "Paco, Botolanasdasdsadasasdasd"
},function(result,message){
    console.log(result,message)
})*/

/*search_like('accounts','address','sdsadasasda',function(result,data){
    console.log(result,data)
})*/

/*deleteRow('accounts',{'id': 1581278326990},function(result,data){
    console.log(result,data)
})*/
/*clearTable('accounts',function(result,data){
    console.log(result,data)
})*/
/*count('accounts',function(result,data){
    console.log(result,data)
})*/
