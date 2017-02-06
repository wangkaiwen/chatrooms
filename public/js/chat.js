/**
 * Created by admin on 2016-10-29.
 */
var Chat=function (socket) {
    this.socket=socket;
};
//发送消息
Chat.prototype.sendMessage=function (room,text) {
    var message={
        room:room,
        text:text
    };
    this.socket.emit('message',message);
};
//变更房间
Chat.prototype.changeRoom=function (room) {
    this.socket.emit('join',{newRoom:room})
};
//处理聊天命令
Chat.prototype.processCommand=function (command) {
    var words=command.split(' ');
    command=words[0].substring(1,words[0].length).toLowerCase();
    var message=false;

    switch (command){
        case 'join':
            words.shift();
            var room=words.join(' ');
            this.changeRoom(room);
            break;
        case 'nick':
            words.shift();
            var name=words.join(' ');
            this.socket.emit('nameAttempt',name);
            break;
        default:
            message='无效命令';
            break;
    }
    return message;
}


