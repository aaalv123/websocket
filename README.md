# websocket

websocket 调试连接 

采用二进制字节流格式传输 （ArrayBuffer）

格式为 ： Uint16(总数据流长度) + Uint32(code码) + Uint16(传输数据data的长度) + data + Uint16(传输数据data的长度) + data + Uint16(传输数据data的长度) + data + ...
