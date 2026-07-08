import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:network_info_plus/network_info_plus.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import 'login_screen.dart';
import 'history_screen.dart';

class HomeScreen extends StatefulWidget {
  final Map<String, dynamic> user;
  const HomeScreen({super.key, required this.user});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _checking = false;
  String _status = 'Prêt';
  String? _activeSessionId;

  @override
  void initState() {
    super.initState();
    _checkActiveSession();
  }

  Future<void> _checkActiveSession() async {
    final sessions = await ApiService.getMySessions(widget.user['id'] ?? widget.user['sub']);
    if (sessions.isNotEmpty && sessions.first['heure_depart'] == null) {
      setState(() => _activeSessionId = sessions.first['id']);
    }
  }

  Future<void> _pointage({required bool checkin}) async {
    setState(() => _checking = true);
    try {
      final email = widget.user['email'] as String;

      Position pos;
      try {
        pos = await Geolocator.getCurrentPosition();
      } catch (_) {
        pos = Position(longitude: 0, latitude: 0, timestamp: DateTime.now(), accuracy: 0, altitude: 0, heading: 0, speed: 0, speedAccuracy: 0, altitudeAccuracy: 0, headingAccuracy: 0);
      }

      String? bssid;
      try {
        bssid = await NetworkInfo().getWifiBSSID();
      } catch (_) {}

      if (checkin) {
        final zones = await ApiService.verifyZone(bssid ?? '');
        if (zones['valide'] != true) {
          setState(() => _status = 'Zone WiFi non autorisée');
          return;
        }

        if (!mounted) return;
        final pinCtrl = TextEditingController();
        final pin = await showDialog<String>(context: context, builder: (ctx) => AlertDialog(title: const Text('Code PIN'), content: TextField(controller: pinCtrl, obscureText: true, decoration: const InputDecoration(labelText: 'PIN', border: OutlineInputBorder())), actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')), ElevatedButton(onPressed: () => Navigator.pop(ctx, pinCtrl.text), child: const Text('Valider'))]));
        if (pin == null || pin.isEmpty) return;

        final verify = await ApiService.verifyPin(email, pin);
        if (verify['valide'] != true) {
          setState(() => _status = 'Code PIN invalide');
          return;
        }

        final deviceId = await AuthService.getDeviceId();
        final session = await ApiService.checkin(
          userId: widget.user['id'] ?? widget.user['sub'],
          latitude: pos.latitude,
          longitude: pos.longitude,
          bssid: bssid,
          codePin: pin,
          deviceId: deviceId,
        );
        setState(() {
          _activeSessionId = session['id'];
          _status = 'Pointage enregistré';
        });
      } else {
        await ApiService.checkout(widget.user['id'] ?? widget.user['sub']);
        setState(() {
          _activeSessionId = null;
          _status = 'Dépointage enregistré';
        });
      }
    } catch (e) {
      setState(() => _status = 'Erreur: $e');
    } finally {
      if (mounted) setState(() => _checking = false);
    }
  }

  Future<void> _logout() async {
    await AuthService.logout();
    if (!mounted) return;
    Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const LoginScreen()), (_) => false);
  }

  @override
  Widget build(BuildContext context) {
    final name = widget.user['prenom'] != null ? '${widget.user['prenom']} ${widget.user['nom']}' : widget.user['email'];
    return Scaffold(
      appBar: AppBar(title: Text('Bonjour $name'), actions: [
        IconButton(icon: const Icon(Icons.history), onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => HistoryScreen(userId: widget.user['id'] ?? widget.user['sub'])))),
        IconButton(icon: const Icon(Icons.logout), onPressed: _logout),
      ]),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(_activeSessionId != null ? Icons.check_circle : Icons.radio_button_unchecked, size: 80, color: _activeSessionId != null ? Colors.green : Colors.grey),
              const SizedBox(height: 16),
              Text(_activeSessionId != null ? 'Pointé' : 'Non pointé', style: const TextStyle(fontSize: 20)),
              const SizedBox(height: 32),
              SizedBox(width: double.infinity, height: 56, child: ElevatedButton.icon(
                icon: _checking ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : Icon(_activeSessionId != null ? Icons.logout : Icons.login),
                label: Text(_activeSessionId != null ? 'Dépointer' : 'Pointer', style: const TextStyle(fontSize: 18)),
                onPressed: _checking ? null : () => _pointage(checkin: _activeSessionId == null),
                style: ElevatedButton.styleFrom(backgroundColor: _activeSessionId != null ? Colors.red : Colors.green, foregroundColor: Colors.white),
              )),
              const SizedBox(height: 16),
              Text(_status, style: const TextStyle(color: Colors.grey)),
            ],
          ),
        ),
      ),
    );
  }
}
