import 'dart:io';
import 'package:flutter/material.dart';
import 'package:device_info_plus/device_info_plus.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
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
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.fingerprint, size: 64, color: Colors.orange),
              const SizedBox(height: 16),
              const Text('Attendance', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 32),
              TextField(controller: _emailCtrl, decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()), keyboardType: TextInputType.emailAddress),
              const SizedBox(height: 16),
              TextField(controller: _passwordCtrl, decoration: const InputDecoration(labelText: 'Mot de passe', border: OutlineInputBorder()), obscureText: true),
              const SizedBox(height: 24),
              SizedBox(width: double.infinity, height: 48, child: ElevatedButton(onPressed: _loading ? null : _login, child: _loading ? const CircularProgressIndicator() : const Text('Se connecter', style: TextStyle(fontSize: 16)))),
            ],
          ),
        ),
      ),
    );
  }
}
