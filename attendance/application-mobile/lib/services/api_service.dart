import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static final Dio _dio = Dio();
  static final FlutterSecureStorage _storage = const FlutterSecureStorage();
  static bool _initialized = false;

  static Future<void> init() async {
    if (_initialized) return;
    
    await dotenv.load(fileName: '.env');
    
    final baseUrl = dotenv.env['API_BASE_URL'] ?? 'http://192.168.1.181:3002/api';
    final timeout = int.tryParse(dotenv.env['API_TIMEOUT'] ?? '10000') ?? 10000;
    
    _dio.options = BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: Duration(milliseconds: timeout),
      receiveTimeout: Duration(milliseconds: timeout),
      sendTimeout: Duration(milliseconds: timeout),
      headers: {'Content-Type': 'application/json'},
      validateStatus: (status) => status != null && status >= 200 && status < 300,
    );

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          await _storage.delete(key: 'attendance_token');
          await _storage.delete(key: 'attendance_user');
          // Could trigger logout here via callback
        }
        return handler.next(error);
      },
    ));

    _dio.interceptors.add(RetryInterceptor(
      dio: _dio,
      retries: int.tryParse(dotenv.env['API_RETRY_COUNT'] ?? '3') ?? 3,
      retryDelays: const [Duration(seconds: 1), Duration(seconds: 2), Duration(seconds: 3)],
    ));

    _initialized = true;
  }

  static Future<String?> _getToken() async {
    return await _storage.read(key: 'attendance_token');
  }

  static Future<void> _saveToken(String token) async {
    await _storage.write(key: 'attendance_token', value: token);
  }

  static Future<void> _clearToken() async {
    await _storage.delete(key: 'attendance_token');
    await _storage.delete(key: 'attendance_user');
    await _storage.delete(key: 'attendance_device_id');
  }

  // Auth
  static Future<Map<String, dynamic>> login(String email, String password) async {
    await init();
    try {
      final res = await _dio.post('/auth/login', data: {'email': email, 'password': password});
      if (res.statusCode == 200 || res.statusCode == 201) {
final data = res.data;
      if (data['access_token'] != null) {
        await _saveToken(data['access_token']);
      }
      return data;
    }
    throw Exception(res.data['message'] ?? 'Erreur connexion');
    } on DioException catch (e) {
      String message;
      if (e.response != null && e.response?.data != null) {
        message = e.response?.data['message'] ?? 'Erreur connexion';
      } else {
        switch (e.type) {
          case DioExceptionType.connectionTimeout:
          case DioExceptionType.receiveTimeout:
          case DioExceptionType.sendTimeout:
            message = 'Timeout - Le serveur ne répond pas';
            break;
          case DioExceptionType.connectionError:
            message = 'Impossible de joindre le serveur (vérifiez l\'IP et le port)';
            break;
          case DioExceptionType.badResponse:
            message = 'Erreur serveur: ${e.response?.statusCode}';
            break;
          default:
            message = 'Erreur réseau: ${e.message}';
        }
      }
      throw Exception(message);
    }
  }

  // Zone verification
  static Future<Map<String, dynamic>> verifyZone({
    String? bssid,
    String? ssid,
    String? ipLocale,
  }) async {
    await init();
    try {
      final res = await _dio.post('/mobile/verify-zone', data: {
        'bssid': ?bssid,
        'ssid': ?ssid,
        'ipLocale': ?ipLocale,
      });
      return res.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur vérification zone');
    }
  }

  static Future<Map<String, dynamic>> verifyPin(String email, String codePin) async {
    await init();
    try {
      final res = await _dio.post('/mobile/verify-pin', data: {'email': email, 'codePin': codePin});
      return res.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur vérification PIN');
    }
  }

  // Check-in/out
  static Future<Map<String, dynamic>> checkin({
    required String userId,
    String? deviceId,
    double? latitude,
    double? longitude,
    String? bssid,
    String? codePin,
  }) async {
    await init();
    try {
      final res = await _dio.post('/sessions/checkin', data: {
        'userId': userId,
        'deviceId': ?deviceId,
        'method': 'pin',
        'latitude': ?latitude,
        'longitude': ?longitude,
        'bssid': ?bssid,
        'codePin': ?codePin,
      });
      if (res.statusCode == 201) return res.data;
      throw Exception(res.data['message'] ?? 'Erreur pointage');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur pointage');
    }
  }

  static Future<Map<String, dynamic>> checkout(String userId, {String? deviceId}) async {
    await init();
    try {
      final res = await _dio.post('/sessions/checkout', data: {'userId': userId, 'deviceId': ?deviceId});
      if (res.statusCode == 201) return res.data;
      throw Exception(res.data['message'] ?? 'Erreur dépointage');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur dépointage');
    }
  }

  // Sessions
  static Future<List<dynamic>> getMySessions(String userId) async {
    await init();
    try {
      final res = await _dio.get('/sessions/$userId');
      if (res.data is List) return res.data as List<dynamic>;
      if (res.data is Map && res.data['value'] is List) return res.data['value'] as List<dynamic>;
      return [];
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur sessions');
    }
  }

  // Requests
  static Future<List<dynamic>> getMyRequests() async {
    await init();
    try {
      final res = await _dio.get('/requests/mine');
      if (res.data is List) return res.data as List<dynamic>;
      if (res.data is Map && res.data['value'] is List) return res.data['value'] as List<dynamic>;
      return [];
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur demandes');
    }
  }

  static Future<Map<String, dynamic>> createRequest({
    required String type,
    String? dateDebut,
    String? dateFin,
    required String motif,
  }) async {
    await init();
    try {
      final res = await _dio.post('/requests', data: {
        'type': type,
        'dateDebut': ?dateDebut,
        'dateFin': ?dateFin,
        'motif': motif,
      });
      return res.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur création demande');
    }
  }

  // Devices
  static Future<Map<String, dynamic>> selfAssociateDevice({
    required String identifiantAppareil,
    String? modele,
    String? marque,
  }) async {
    await init();
    try {
      final res = await _dio.post('/devices/self', data: {
        'identifiantAppareil': identifiantAppareil,
        'modele': ?modele,
        'marque': ?marque,
      });
      return res.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur association appareil');
    }
  }

  // Password
  static Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await init();
    try {
      final res = await _dio.patch('/auth/password', data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      });
      if (res.statusCode == 200) return res.data;
      throw Exception(res.data['message'] ?? 'Erreur changement mot de passe');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur changement mot de passe');
    }
  }

  // PIN
  static Future<Map<String, dynamic>> changePin({
    required String currentPin,
    required String newPin,
  }) async {
    await init();
    try {
      final res = await _dio.patch('/auth/pin', data: {
        'currentPin': currentPin,
        'newPin': newPin,
      });
      if (res.statusCode == 200) return res.data;
      throw Exception(res.data['message'] ?? 'Erreur changement PIN');
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur changement PIN');
    }
  }

  // Profile
  static Future<Map<String, dynamic>> getProfile() async {
    await init();
    try {
      final res = await _dio.get('/auth/me');
      return res.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur profil');
    }
  }

  static Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    await init();
    try {
      final res = await _dio.patch('/auth/profile', data: data);
      return res.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur mise à jour profil');
    }
  }

  // Upload
  static Future<Map<String, dynamic>> uploadPhoto(File file) async {
    await init();
    try {
      final token = await _storage.read(key: 'attendance_token');
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(file.path),
      });
      final res = await _dio.post('/upload', data: formData, options: Options(
        headers: {'Authorization': 'Bearer $token'},
      ));
      return res.data;
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Erreur upload');
    }
  }

  // Logout
  static Future<void> logout() async {
    await _clearToken();
  }
}

class RetryInterceptor extends Interceptor {
  final Dio dio;
  final int retries;
  final List<Duration> retryDelays;

  RetryInterceptor({
    required this.dio,
    this.retries = 3,
    this.retryDelays = const [Duration(seconds: 1), Duration(seconds: 2), Duration(seconds: 3)],
  });

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (_shouldRetry(err) && _retryCount(err) < retries) {
      final count = _retryCount(err) + 1;
      err.requestOptions.extra['retryCount'] = count;
      final delay = retryDelays[(count - 1) % retryDelays.length];
      await Future.delayed(delay);
      try {
        final response = await dio.request(
          err.requestOptions.path,
          options: Options(
            method: err.requestOptions.method,
            headers: err.requestOptions.headers,
            extra: err.requestOptions.extra,
          ),
          data: err.requestOptions.data,
          queryParameters: err.requestOptions.queryParameters,
        );
        return handler.resolve(response);
      } catch (e) {
        return handler.next(err);
      }
    }
    return handler.next(err);
  }

  int _retryCount(DioException err) => err.requestOptions.extra['retryCount'] as int? ?? 0;

  bool _shouldRetry(DioException err) {
    return err.type == DioExceptionType.connectionTimeout ||
           err.type == DioExceptionType.receiveTimeout ||
           err.type == DioExceptionType.sendTimeout ||
           err.type == DioExceptionType.connectionError ||
           (err.response?.statusCode != null && err.response!.statusCode! >= 500);
  }
}