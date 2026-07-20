import 'dart:io';
import 'package:flutter/material.dart';
import 'package:device_info_plus/device_info_plus.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../constants/app_colors.dart';
import 'home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _loading = false;

  Future<void> _login() async {
    if (_emailCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Veuillez entrer votre email')));
      return;
    }
    if (_passwordCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Veuillez entrer votre mot de passe')));
      return;
    }
    setState(() => _loading = true);
    try {
      final data = await ApiService.login(_emailCtrl.text.trim(), _passwordCtrl.text);

      final token = data['access_token'] as String;
      final user = data['user'] as Map<String, dynamic>;

      await AuthService.saveToken(token);
      await AuthService.saveUser(user);

      if (!mounted) return;

      String deviceId;
      String modele = '';
      String marque = '';

      if (Platform.isAndroid) {
        final androidInfo = await DeviceInfoPlugin().androidInfo;
        deviceId = androidInfo.id;
        modele = androidInfo.model;
        marque = androidInfo.brand;
      } else if (Platform.isIOS) {
        final iosInfo = await DeviceInfoPlugin().iosInfo;
        deviceId = iosInfo.identifierForVendor ?? 'ios-unknown';
        modele = iosInfo.model;
        marque = 'Apple';
      } else {
        deviceId = 'unknown-${DateTime.now().millisecondsSinceEpoch}';
      }

      try {
        await ApiService.selfAssociateDevice(
          identifiantAppareil: deviceId,
          modele: modele,
          marque: marque,
        );
        await AuthService.saveDeviceId(deviceId);
      } catch (_) {}

      if (!mounted) return;
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => HomeScreen(user: user)));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 40),
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: const Icon(Icons.fingerprint, size: 44, color: Colors.white),
                ),
                const SizedBox(height: 20),
                const Text(
                  'AttendX',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w700,
                    color: AppColors.onSurface,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Entrez vos identifiants pour continuer',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 40),
                TextField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  style: const TextStyle(fontSize: 16),
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.alternate_email, color: AppColors.onSurfaceVariant),
                    hintText: 'Email',
                    filled: true,
                    fillColor: AppColors.surfaceContainerAlt,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _passwordCtrl,
                  obscureText: true,
                  style: const TextStyle(fontSize: 16),
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.lock, color: AppColors.onSurfaceVariant),
                    hintText: 'Mot de passe',
                    filled: true,
                    fillColor: AppColors.surfaceContainerAlt,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _login,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(26),
                      ),
                      elevation: 0,
                    ),
                    child: _loading
                        ? const SizedBox(
                            width: 22, height: 22,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Se connecter', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(height: 24),
                TextButton.icon(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Fonctionnalité à venir')),
                    );
                  },
                  icon: const Icon(Icons.face, color: AppColors.accent),
                  label: const Text(
                    'Utiliser Touch ID / Face ID',
                    style: TextStyle(color: AppColors.accent, fontSize: 14),
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
