import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'auth_service.dart';

class ApiService {
  static const String baseUrl = 'http://192.168.1.100:3002/api';

  static Future<Map<String, String>> _headers() async {
    final token = await AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    if (res.statusCode != 200) throw Exception(jsonDecode(res.body)['message'] ?? 'Erreur connexion');
    return jsonDecode(res.body);
  }

  static Future<Map<String, dynamic>> verifyZone(String bssid) async {
    final res = await http.post(
      Uri.parse('$baseUrl/mobile/verify-zone'),
      headers: await _headers(),
      body: jsonEncode({'bssid': bssid}),
    );
    return jsonDecode(res.body);
  }

  static Future<Map<String, dynamic>> verifyPin(String email, String codePin) async {
    final res = await http.post(
      Uri.parse('$baseUrl/mobile/verify-pin'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'codePin': codePin}),
    );
    return jsonDecode(res.body);
  }

  static Future<Map<String, dynamic>> checkin({
    required String userId,
    String? deviceId,
    double? latitude,
    double? longitude,
    String? bssid,
    String? codePin,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/sessions/checkin'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'userId': userId,
        if (deviceId != null) 'deviceId': deviceId,
        'method': 'pin',
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        if (bssid != null) 'bssid': bssid,
        if (codePin != null) 'codePin': codePin,
      }),
    );
    if (res.statusCode != 201) throw Exception(jsonDecode(res.body)['message'] ?? 'Erreur pointage');
    return jsonDecode(res.body);
  }

  static Future<Map<String, dynamic>> checkout(String userId, {String? deviceId}) async {
    final res = await http.post(
      Uri.parse('$baseUrl/sessions/checkout'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'userId': userId, if (deviceId != null) 'deviceId': deviceId}),
    );
    if (res.statusCode != 201) throw Exception(jsonDecode(res.body)['message'] ?? 'Erreur dépointage');
    return jsonDecode(res.body);
  }

  static Future<List<dynamic>> getMySessions(String userId) async {
    final res = await http.get(
      Uri.parse('$baseUrl/sessions/$userId'),
      headers: await _headers(),
    );
    return jsonDecode(res.body)['value'] ?? jsonDecode(res.body);
  }

  static Future<List<dynamic>> getMyRequests() async {
    final res = await http.get(
      Uri.parse('$baseUrl/requests/mine'),
      headers: await _headers(),
    );
    return jsonDecode(res.body)['value'] ?? jsonDecode(res.body);
  }

  static Future<Map<String, dynamic>> createRequest({
    required String type,
    String? dateDebut,
    String? dateFin,
    required String motif,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/requests'),
      headers: await _headers(),
      body: jsonEncode({
        'type': type,
        if (dateDebut != null) 'dateDebut': dateDebut,
        if (dateFin != null) 'dateFin': dateFin,
        'motif': motif,
      }),
    );
    return jsonDecode(res.body);
  }

  static Future<Map<String, dynamic>> selfAssociateDevice({
    required String identifiantAppareil,
    String? modele,
    String? marque,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/devices/self'),
      headers: await _headers(),
      body: jsonEncode({
        'identifiantAppareil': identifiantAppareil,
        if (modele != null) 'modele': modele,
        if (marque != null) 'marque': marque,
      }),
    );
    return jsonDecode(res.body);
  }

  static Future<Map<String, dynamic>> uploadPhoto(File file) async {
    final token = await AuthService.getToken();
    final req = http.MultipartRequest('POST', Uri.parse('$baseUrl/upload'));
    if (token != null) req.headers['Authorization'] = 'Bearer $token';
    req.files.add(await http.MultipartFile.fromPath('file', file.path));
    final res = await req.send();
    return jsonDecode(await res.stream.bytesToString());
  }

  static Future<Map<String, dynamic>> getProfile() async {
    final res = await http.get(
      Uri.parse('$baseUrl/auth/me'),
      headers: await _headers(),
    );
    return jsonDecode(res.body);
  }

  static Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    final res = await http.patch(
      Uri.parse('$baseUrl/auth/profile'),
      headers: await _headers(),
      body: jsonEncode(data),
    );
    return jsonDecode(res.body);
  }
}
