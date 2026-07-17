import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:network_info_plus/network_info_plus.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/biometric_service.dart';
import 'login_screen.dart';
import 'history_screen.dart';
import 'profile_screen.dart';

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
  String? _bssid;
  String? _ssid;
  String? _ipLocale;

  @override
  void initState() {
    super.initState();
    _checkActiveSession();
    _refreshNetworkInfo();
  }

  Future<void> _refreshNetworkInfo() async {
    try {
      final info = NetworkInfo();
      _bssid = await info.getWifiBSSID();
      _ssid = await info.getWifiName();
      try {
        _ipLocale = await info.getWifiIP();
      } catch (_) {
        _ipLocale = null;
      }
    } catch (_) {
      _bssid = null;
      _ssid = null;
      _ipLocale = null;
    }
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

      await _refreshNetworkInfo();

      if (checkin) {
        // Vérification fuseau horaire (Yaoundé = UTC+1)
        final offset = DateTime.now().timeZoneOffset;
        if (offset != const Duration(hours: 1)) {
          setState(() => _status = 'Fuseau horaire invalide — réglez votre téléphone sur Yaoundé (UTC+1)');
          return;
        }

        final zones = await ApiService.verifyZone(
          bssid: _bssid,
          ssid: _ssid,
          ipLocale: _ipLocale,
        );
        if (zones['valide'] != true) {
          final erreurs = (zones['erreurs'] as List?)?.join(', ') ?? 'BSSID non reconnu';
          setState(() => _status = 'Zone WiFi non autorisée: $erreurs');
          return;
        }

        // Choix méthode d'authentification : Biométrie ou PIN
        final useBiometric = await _showAuthChoiceDialog();
        String? pin;

        if (useBiometric) {
          final bioOk = await BiometricService.authenticate(reason: 'Authentification pour le pointage');
          if (!bioOk) {
            setState(() => _status = 'Authentification biométrique annulée');
            return;
          }
        } else {
          if (!mounted) return;
          final pinCtrl = TextEditingController();
          final pinInput = await showDialog<String>(context: context, builder: (ctx) => AlertDialog(title: const Text('Code PIN'), content: TextField(controller: pinCtrl, obscureText: true, decoration: const InputDecoration(labelText: 'PIN', border: OutlineInputBorder())), actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')), ElevatedButton(onPressed: () => Navigator.pop(ctx, pinCtrl.text), child: const Text('Valider'))]));
          if (pinInput == null || pinInput.isEmpty) return;
          pin = pinInput;

          final verify = await ApiService.verifyPin(email, pin);
          if (verify['valide'] != true) {
            setState(() => _status = 'Code PIN invalide');
            return;
          }
        }

        final deviceId = await AuthService.getDeviceId();
        final session = await ApiService.checkin(
          userId: widget.user['id'] ?? widget.user['sub'],
          latitude: pos.latitude,
          longitude: pos.longitude,
          bssid: _bssid,
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

  Future<bool> _showAuthChoiceDialog() async {
    final canBio = await BiometricService.canAuthenticate();
    if (!canBio) return false;

    final biometrics = await BiometricService.getAvailableBiometrics();
    final label = BiometricService.getBiometricLabel(biometrics);

    if (!mounted) return false;
    return await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Méthode d\'authentification'),
            content: Text('Utiliser $label ?'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Code PIN')),
              ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: Text(label)),
            ],
          ),
        ) ??
        false;
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
        IconButton(icon: const Icon(Icons.person), onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProfileScreen(user: widget.user)))),
        IconButton(icon: const Icon(Icons.history), onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => HistoryScreen(userId: widget.user['id'] ?? widget.user['sub'])))),
        IconButton(icon: const Icon(Icons.logout), onPressed: _logout),
      ]),
      body: Column(
        children: [
          Expanded(
            child: Center(
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
          ),
          // Network info card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              border: Border(top: BorderSide(color: Colors.grey.shade300)),
            ),
            child: Row(
              children: [
                Icon(Icons.wifi, size: 16, color: _bssid != null ? Colors.green : Colors.red.shade300),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _ssid ?? 'Non connecté',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                      Text(
                        _bssid != null ? 'BSSID: $_bssid' : 'WiFi indisponible',
                        style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.refresh, size: 18),
                  onPressed: () => setState(() { _refreshNetworkInfo(); }),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
