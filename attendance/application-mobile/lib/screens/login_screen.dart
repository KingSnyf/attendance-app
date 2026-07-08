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
    setState(() => _loading = true);
    try {
      final data = await ApiService.login(_emailCtrl.text.trim(), _passwordCtrl.text);

      final token = data['access_token'] as String;
      final user = data['user'] as Map<String, dynamic>;

      await AuthService.saveToken(token);
      await AuthService.saveUser(user);

      if (!mounted) return;

      final deviceInfo = DeviceInfoPlugin();
      final androidInfo = await deviceInfo.androidInfo;
      final deviceId = androidInfo.id;

      try {
        await ApiService.selfAssociateDevice(
          identifiantAppareil: deviceId,
          modele: androidInfo.model,
          marque: androidInfo.brand,
        );
        await AuthService.saveDeviceId(deviceId);
      } catch (_) {}

      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => HomeScreen(user: user)));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${e}')));
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
