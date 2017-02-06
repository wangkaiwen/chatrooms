
/**
 * Created by admin on 2016-10-29.
 */
//用来显示可疑文本  防止XSS攻击
function divEscapedContentElement(message){
    return $('<div></div>').text(message);
}
// 用来显示系统文本
function divSystemContentElement(message) {
    return $('<div></div>').html('<i>'+message+'</i>');
}

//处理原始用户输入
function processUserInput(chatApp,socket) {
    var message=$('#send-message').val();
    var systemMessage;
    if(message.charAt(0)=='/'){
        systemMessage=chatApp.processCommand(message);
    }else{
        chatApp.sendMessage($('#room').text(),message);
        $('#messages').append(divEscapedContentElement(message)).scrollTop($('#messages').prop('scrollHeight'));
    }

    $('#send-message').val('');
}

//程序初始化逻辑
var socket=io.connect();
$(document).ready(function () {
    var chatApp=new Chat(socket);

    socket.on('nameResult',function (result) {
        var message;
        if(result.success){
            message='您现在的昵称叫做'+result.name+'.';
        }else{
            message=result.message;
        }
        $('#messages').append(divSystemContentElement(message));
    });

    socket.on('joinResult',function (result) {
        $('#room').text(result.room);
        $('#messages').append(divSystemContentElement('房间改变成功'));
    });

    socket.on('message',function (message) {
        var newElement=$('<div></div>').text(message.text);
        $('#messages').append(newElement);
    });

    socket.on('rooms',function (rooms) {
        // console.log(rooms)
        $('#room-list').empty();
        for(var room in rooms){
            room=room.substring(1,room.length);
            if(room !=''){
                $('#room-list').append(divEscapedContentElement(room));
            }
        }

        $('#room-list div').on('click',function () {
            chatApp.processCommand('/join '+$(this).text());
            $('#send-message').focus();
        });
    });

    setInterval(function () {
        socket.emit('rooms');
    },1000);
    $('#send-message').focus();

    $('#send-form').submit(function () {
        processUserInput(chatApp,socket);
        return false;
    })


});


