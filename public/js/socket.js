'use strict';
$(function() {
    var socket = io.connect(host,{ 'forceNew': true });
    socket.on('connect', function(){
        var data_socket = {
            'userId' : $('input[name="userId"]').val(),
            'userFullname' : $('input[name="userFullname"]').val()
        };
        
        socket.emit('User:Online', data_socket);
    });
    socket.on('User:Offline', function(data_socket){
        var table = $('#table_user').DataTable();
            table.rows().every( function ( rowIdx, tableLoop, rowLoop ) {
            var data = this.data();
            if (data[5].split('data-id=')[1].split('"')[1] == data_socket)
            {
                data[4] = '<i class="icon-circle" style="background: #585757; border-radius: 50%; color: #585757;"></i>';
                this.row(rowIdx).data(data);
                table.draw();
                user_socket();
            }
        });
    });
    socket.on('User:Online', function(data_socket){
        var table = $('#table_user').DataTable();
            table.rows().every( function ( rowIdx, tableLoop, rowLoop ) {
            var data = this.data();
            if (data[5].split('data-id=')[1].split('"')[1] == data_socket)
            {
                data[4] = '<i class="icon-circle" style="background: #4CAF50; border-radius: 50%; color: #4CAF50;"></i>';
                this.row(rowIdx).data(data);
                table.draw();
                user_socket();
            }
        });
    });
    
    socket.on('User:Logout', function(data_socket){
        var userId = $('input[name="userId"]').val();
        console.log(userId,data_socket);
        if (userId == data_socket)
        {
            window.location.href = "/administrator/logout";
        }
    });
 
})
function user_socket(){
    $('.edit_user').on('click',function(){
        var id = $(this).data('id');
        $.ajax({
            url : "/administrator/user/get-user-id",
            type : "post",
            dataType:"text",
            data : {
                'id' : id
            },
            success : function (result){
                var data = $.parseJSON(result)
                $('#modal_edit_user_modal input[name="fullname"]').val(data.fullname);
                $('#modal_edit_user_modal input[name="telephone"]').val(data.telephone);
                $('#modal_edit_user_modal select[name="status"]').val(data.status);
                $('#modal_edit_user_modal input[name="id"]').val(data._id);
                $('#modal_edit_user_modal').modal('show');
            }
        })
        return false;
    });


    $('.remove_service').on('click',function(){
        var id = $(this).data('id');
        if(confirm('Bạn có chắc chắn với lựa chọn của mình ?'))
        {
            $.ajax({
                url : "/administrator/user/remove-user-by-id",
                type : "post",
                dataType:"text",
                data : {
                    'id' : id
                },
                success : function (result){
                    location.reload();
                }
            })
        }
        
            
        return false;
    })
}