import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  static const FlutterSecureStorage _secure = FlutterSecureStorage();
  static const _tokenKey = 'attendance_token';
  static const _userKey = 'attendance_user';
  static const _deviceIdKey = 'attendance_device_id';

  static Future<String?> getToken() async {
    return await _secure.read(key: _tokenKey);
  }

  static Future<void> saveToken(String token) async {
    await _secure.write(key: _tokenKey, value: token);
  }

  static Future<Map<String, dynamic>?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_userKey);
    if (raw == null) return null;
    return jsonDecode(raw);
  }

  static Future<void> saveUser(Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(user));
  }

  static Future<String?> getDeviceId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_deviceIdKey);
  }

  static Future<void> saveDeviceId(String deviceId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_deviceIdKey, deviceId);
  }

  static Future<void> logout() async {
    await _secure.delete(key: _tokenKey);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userKey);
    await prefs.remove(_deviceIdKey);
  }
}
