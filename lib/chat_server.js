/**
 * Created by admin on 2016-10-29.
 */
var socketio=require('socket.io');
var io;
var guestNumber=1;
var nickNames={};
var namesUsed=[];
var currentRoom={};

exports.listen=function (server) {
    io=socketio.listen(server);//启动socket.io 允许它搭载在已有的HTTP 服务器上
    io.set('log level',1);
    io.sockets.on('connection',function (socket) {//定义每个用户连接处理逻辑
         guestNumber=assignGuestName(socket,guestNumber,nickNames,namesUsed);//为每个连接上来的用户赋予一个访客名
         joinRoom(socket,'Lobby');//在用户连接上来时把用户放入聊天室Lobby里
        handleMessageBroadcasting(socket,nickNames);//处理用户消息
        handleNameChangeAttempts(socket,nickNames,namesUsed);//处理用户更名，聊天室的变更和创建
        handleRoomJoining(socket);

        socket.on('rooms',function () {//用户发出请求时，向其提供已经被占用的聊天室
            socket.emit('rooms',io.sockets.manager.rooms); //1.0版本用 io.sockets.adapter.rooms
        });
        handleClientDisconnection(socket,nickNames,namesUsed);//定义用户断开连接后的清楚逻辑
    })
};

// 分配用户昵称
function assignGuestName(socket,guestNumber,nickNames,namesUsed) {
    var name='Guest'+guestNumber;//生成新昵称
    nickNames[socket.id]=name;//把用户昵称跟客户端连接ID关联
    socket.emit('nameResult',{   //昵称返回给用户
        success:true,
        name:name
    });
    namesUsed.push(name);//存放已经被占用的昵称
    return guestNumber+1;  //增加用来生成昵称的计数器
}

//进入聊天室
function joinRoom(socket,room) {
     socket.join(room);//让用户进入房间
    currentRoom[socket.id]=room;//记录用户当前的房间
    socket.emit('joinResult',{room:room});//让用户指定进入新房间
    socket.broadcast.to(room).emit('message',{//让其他用户知道有新用户进来了
        text:nickNames[socket.id]+'has joined'+room+'.'
    });
    var userInRoom=io.sockets.clients(room);//确定有哪些用户在这个房间里  1.0版本用 io.sockets.adapter.rooms[room]
    if(userInRoom.length>1){
        var usersInRoomSummary='Users currently in '+room+':';
        for(var index in userInRoom){
            var userSocketId=userInRoom[index].id;
            if(userSocketId!=socket.id){
                if(index>0){
                    usersInRoomSummary+=', ';
                }
                usersInRoomSummary+=nickNames[userSocketId];
            }
        }
        usersInRoomSummary+='.';
        socket.emit('message',{text:usersInRoomSummary});//将房间其他用户信息发送给这个用户
    }
}

//处理昵称变更
function handleNameChangeAttempts(socket,nickNames,namesUsed) {
    socket.on('nameAttempt',function (name) {
        if(name.indexOf('Guest')==0){//名称不能以Guest开头
            socket.emit('nameResult',{
                success:false,
                message:'昵称开头不能用Guest'
            });
        }else{
            if(namesUsed.indexOf(name)==-1){//检查昵称是否注册过
                var previousName=nickNames[socket.id];
                var previousNameIndex=namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id]=name;
                delete namesUsed[previousNameIndex];//删除之前用过的昵称
                socket.emit('nameResult',{
                    success:true,
                    name:name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit('message',{text:previousName+'is now known as '+name+'.'})
            }else{//昵称被占用
                socket.emit('nameResult',{
                    success:false,
                    message:'此昵称已被使用'
                })
            }
        }
    });
}

//发送聊天消息
function handleMessageBroadcasting(socket) {
    socket.on('message',function (message) {
        socket.broadcast.to(message.room).emit('message',{
            text:nickNames[socket.id]+':'+message.text
        })
    })
}

//创建房间
function handleRoomJoining(socket) {
    socket.on('join',function (room) {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket,room.newRoom);
    })
}

//用户断开连接
function handleClientDisconnection(socket) {
    socket.on('disconnect',function () {
        var nameIndex=namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    })
}