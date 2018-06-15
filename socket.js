var socket = (function(){
    var messageCallback;
    var webSocket;
    function rigist(url,callback){
        if (typeof(WebSocket) !== 'function') {
           console.log('您的浏览器不支持WebSocket,请更新IE10以上或其他浏览器！');
            return false;
        }
        if(typeof(url) === 'undefined' || url === '' ){
            console.log('需要socket地址');
            return false;
        }
        if(typeof(callback) !== 'function'){
            console.log('callback是一个函数！');
            return false;
        }
        messageCallback = callback;
        start(url);
    }
    function start(url){
        webSocket = new WebSocket(url);
        webSocket.binaryType = 'arraybuffer';
        webSocket.onopen = function (evt) {
            messageCallback({
                code : -200,
                data : ['连接已打开']
            });
        };
        webSocket.onclose = function (evt) {
            messageCallback({
                code : -201,
                data : ['连接关闭']
            });
        };
        webSocket.onerror = function (evt) {
            messageCallback({
                code : -202,
                data : ['连接错误']
            });
        };
        webSocket.onmessage = function (evt) {
            reciveMessage(evt.data);
        };
    }
    // 发送信息
    function send(code,data){
        var buffer; //buffer 构成为 Uint16 Uint32 Uint16 data Uint16 data ...
        var pointer = 0; //指针
        var bytesString = ''; //如果data是字符串 转换后的二进制存在这里
        var bytesArray = []; //如果data是数组 转换后的二进制存在这里
        var byteArrayLength = 0; //计算数组中每个元素的长度
        var hasData = typeof (data) === 'undefined' || data === '';
        if (hasData) {
            buffer = new ArrayBuffer(2 + 4);
        } else {
            if(typeof(data) === 'string'){
                bytesString = stringToByte(data);
                buffer = new ArrayBuffer(2 + 4 + 2 + bytesString.length);
            }
            if(Array.isArray(data)){
                bytesArray = data.map(function(value){
                    var bytes;
                    if(typeof(value) === 'string'){
                        bytes = stringToByte(value);
                    }else{
                        bytes = stringToByte(value.toString());
                    }
                    byteArrayLength += bytes.length;
                    return bytes;
                });
                buffer = new ArrayBuffer(2 + 4 + bytesArray.length * 2 + byteArrayLength);
            }
        }
        var view = new DataView(buffer);
        view.setUint16(0, buffer.byteLength - 2);//缓冲区整体长度
        view.setUint32(2, code);//标识位 如进入房间 发言等等
        if(!hasData){
            var u8 = new Uint8Array(buffer, 6);//发送的数据
            if(bytesString) {
                view.setUint16(pointer + 6, bytesString.length); // 要发送的数据长度
                pointer += 2;
                u8.set(bytesString,pointer);
            }
            if(bytesArray.length > 0){
                bytesArray.forEach(function(value,index){
                    view.setUint16(pointer + 6, value.length); // 要发送的数据长度
                    pointer += 2;
                    u8.set(value,pointer);
                    pointer += value.length;
                });
            }
        }
        webSocket.send(view);
    }
    // 接收信息 data是buffer
    function reciveMessage(data) {
        var reciveView = new DataView(data);
        var bufferlength = reciveView.getUint16(0) - 4; // 减4 是减掉code的长度
        var tempArr = []; //要生成的字符串数组
        var pointer = 6; //指针
        var start = end = 0; //起始位置 结束位置
        while(bufferlength > 0){
            var currentDataLength = reciveView.getUint16(pointer);
            start = pointer + 2; // +2  加记录数据长度的字节数 即Uint16
            end = start + currentDataLength;
            var tempBuffer = new Uint8Array(data.slice(start,end));
            tempArr[tempArr.length] = byteToString(tempBuffer);
            pointer = end;
            bufferlength = bufferlength - currentDataLength -2; // -2  减掉记录数据长度的字节数 即Uint16
        }
        messageCallback({
            code : reciveView.getUint32(2),
            data : tempArr
        });
    }
    // 字符串转二进制
    function stringToByte(str) {
        var bytes = new Array();
        var len, c;
        len = str.length;
        for (var i = 0; i < len; i++) {
            c = str.charCodeAt(i);
            if (c >= 0x010000 && c <= 0x10FFFF) {
                bytes.push(((c >> 18) & 0x07) | 0xF0);
                bytes.push(((c >> 12) & 0x3F) | 0x80);
                bytes.push(((c >> 6) & 0x3F) | 0x80);
                bytes.push((c & 0x3F) | 0x80);
            } else if (c >= 0x000800 && c <= 0x00FFFF) {
                bytes.push(((c >> 12) & 0x0F) | 0xE0);
                bytes.push(((c >> 6) & 0x3F) | 0x80);
                bytes.push((c & 0x3F) | 0x80);
            } else if (c >= 0x000080 && c <= 0x0007FF) {
                bytes.push(((c >> 6) & 0x1F) | 0xC0);
                bytes.push((c & 0x3F) | 0x80);
            } else {
                bytes.push(c & 0xFF);
            }
        }
        return bytes;
    }
    // 二进制数组转字符串
    function byteToString(arr) {
        if (typeof arr === 'string') {
            return arr;
        }
        var str = '',
            _arr = arr;
        for (var i = 0; i < _arr.length; i++) {
            var one = _arr[i].toString(2),
                v = one.match(/^1+?(?=0)/);
            if (v && one.length == 8) {
                var bytesLength = v[0].length;
                var store = _arr[i].toString(2).slice(7 - bytesLength);
                for (var st = 1; st < bytesLength; st++) {
                    store += _arr[st + i].toString(2).slice(2);
                }
                str += String.fromCharCode(parseInt(store, 2));
                i += bytesLength - 1;
            } else {
                str += String.fromCharCode(_arr[i]);
            }
        }
        return str;
    }
    return {
        rigist : rigist,
        send : send
    }
})();
// 使用
// socket.rigist('ws://192.168.1.51:9025',function(data){
//     console.log(data);
// });
// socket.send(0,["y1529053288822", "1529053288822", "44874848"]);
