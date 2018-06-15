# websocket

websocket 调试连接 

采用二进制字节流格式传输 （ArrayBuffer）

格式为 ： Uint16(总数据流长度,不包括自身) + Uint32(code码) + Uint16(传输数据data的长度) + data + Uint16(传输数据data的长度) + data + Uint16(传输数据data的长度) + data + ...

返回数据为
{
  code : 状态码，
  data : 已经转换为字符串的数组，可能为空
}

使用方式见js最后注释的代码
