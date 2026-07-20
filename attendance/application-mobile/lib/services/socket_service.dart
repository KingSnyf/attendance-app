import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  io.Socket? _socket;

  io.Socket? get socket => _socket;

  void connect({required String token, required String userId}) {
    if (_socket != null && _socket!.connected) {
      _ensureRoom(userId);
      return;
    }

    final baseUrl = (dotenv.env['API_BASE_URL'] ?? 'http://192.168.1.181:3002/api')
        .replaceAll(RegExp(r'/api$'), '');

    _socket = io.io(
      '$baseUrl/events',
      io.OptionBuilder()
          .setTransports(['websocket'])
          .enableAutoConnect()
          .setAuth({'token': token})
          .build(),
    );

    _socket!.onConnect((_) {
      _ensureRoom(userId);
    });

    _socket!.connect();
  }

  void _ensureRoom(String userId) {
    _socket?.emit('join', userId);
  }

  void on(String event, Function(dynamic) handler) {
    _socket?.on(event, handler);
  }

  void off(String event, [Function(dynamic)? handler]) {
    if (handler != null) {
      _socket?.off(event, handler);
    } else {
      _socket?.off(event);
    }
  }

  void disconnect() {
    _socket?.disconnect();
  }

  void dispose() {
    _socket?.dispose();
    _socket = null;
  }
}
