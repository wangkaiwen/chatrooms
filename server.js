/**
 * Created by admin on 2016-10-29.
 */
var http=require('http');//提供http服务和客户端功能
var fs=require('fs');//文件系统模块
var path=require('path');//提供与文件系统路径相关的功能
var mime=require('mime');//有根据文件扩展名得出MIME类型的能力
var cache={};//用来缓存文件内容的对象


//未找到页面  404
function send404(response) {
    response.writeHead(404,{'Content-Type':'text/plain'});
    response.write('Error 404:未找到页面');
    response.end();
}

//文件数据服务
function sendFile(response,filePath,fileContents) {
    response.writeHead(200,{'Content-Type':mime.lookup(path.basename(filePath))});//通过后缀名指定mime类型
    response.end(fileContents);
}

//提供静态文件服务
function serverStatic(response,cache,absPath) {
    if(cache[absPath]){//检查文件是否缓存在内存中
        sendFile(response,absPath,cache[absPath]);//从内存中返回文件
    }else{
        fs.exists(absPath,function (exists) {
            if(exists){//检查文件是否存在
                fs.readFile(absPath,function (err,data) {//从硬盘中读取文件
                    if(err){
                        send404(response);
                    }else{
                        cache[absPath]=data;
                        sendFile(response,absPath,data);//读取文件并返回
                    }
                })
            }else{
                send404(response);
            }
        })
    }
}

//创建http服务器
var server=http.createServer();
server.on('request',function(request,response) {
    var filePath=false;
    if(request.url=='/'){
        filePath='public/index.html';
    }else{
        filePath='public'+request.url;
    }
    var absPath='./'+filePath;
    serverStatic(response,cache,absPath);
});

//启动服务器
server.listen(4000,function () {
    console.log('运行服务器 http://127.0.0.1:4000');
});



var chatServer=require('./lib/chat_server');
chatServer.listen(server);


