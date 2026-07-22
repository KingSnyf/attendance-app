import 'dart:async';
import 'package:local_auth/local_auth.dart';

class BiometricService {
  static final LocalAuthentication _auth = LocalAuthentication();

  static Future<bool> canAuthenticate() async {
    try {
      return await _canCheckBiometricsWithTimeout() || await _isDeviceSupportedWithTimeout();
    } catch (_) {
      return false;
    }
  }

  static Future<bool> _canCheckBiometricsWithTimeout() async {
    try {
      return await _auth.canCheckBiometrics.timeout(const Duration(seconds: 5));
    } catch (_) {
      return false;
    }
  }

  static Future<bool> _isDeviceSupportedWithTimeout() async {
    try {
      return await _auth.isDeviceSupported().timeout(const Duration(seconds: 5));
    } catch (_) {
      return false;
    }
  }

  static Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      return await _auth.getAvailableBiometrics().timeout(const Duration(seconds: 5));
    } catch (_) {
      return [];
    }
  }

  static Future<bool> authenticate({
    String reason = 'Authentification pour le pointage',
  }) async {
    try {
      final canCheck = await _canCheckBiometricsWithTimeout();
      final available = await getAvailableBiometrics();
      print('[Biometric] canCheck=$canCheck, available=$available');
      if (!canCheck || available.isEmpty) {
        print('[Biometric] Aucune biométrie disponible -> fallback PIN');
        return false;
      }
      final result = await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          biometricOnly: true,
          stickyAuth: true,
        ),
      ).timeout(const Duration(seconds: 30));
      print('[Biometric] authenticate result=$result');
      return result;
    } on TimeoutException {
      print('[Biometric] timeout');
      return false;
    } catch (e) {
      print('[Biometric] erreur: $e');
      return false;
    }
  }

  static String getBiometricLabel(List<BiometricType> types) {
    if (types.isEmpty) return 'Biométrie';
    final names = types.map((t) {
      switch (t) {
        case BiometricType.face:
          return 'Face ID';
        case BiometricType.fingerprint:
          return 'Empreinte';
        case BiometricType.iris:
          return 'Iris';
        case BiometricType.strong:
          return 'Biométrie forte';
        case BiometricType.weak:
          return 'Biométrie faible';
      }
    }).toList();
    return names.join(' / ');
  }
}