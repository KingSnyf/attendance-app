import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:network_info_plus/network_info_plus.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/biometric_service.dart';
import '../constants/app_colors.dart';
import '../widgets/bottom_nav_bar.dart';
import 'login_screen.dart';
import 'history_screen.dart';
import 'profile_screen.dart';
import 'requests_screen.dart';
import 'settings_screen.dart';

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
  List<dynamic> _sessions = [];

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
    if (!mounted) return;
    setState(() {
      _sessions = sessions;
      if (sessions.isNotEmpty && sessions.first['heure_depart'] == null) {
        _activeSessionId = sessions.first['id'];
      } else {
        _activeSessionId = null;
      }
    });
  }

  Future<void> _pointage({required bool checkin}) async {
    setState(() => _checking = true);
    try {
      final email = widget.user['email'] as String;

      Position pos;
      try {
        pos = await Geolocator.getCurrentPosition();
      } catch (_) {
        pos = Position(
          longitude: 0,
          latitude: 0,
          timestamp: DateTime.now(),
          accuracy: 0,
          altitude: 0,
          heading: 0,
          speed: 0,
          speedAccuracy: 0,
          altitudeAccuracy: 0,
          headingAccuracy: 0,
        );
      }

      await _refreshNetworkInfo();

      if (checkin) {
        final offset = DateTime.now().timeZoneOffset;
        if (offset != const Duration(hours: 1)) {
          setState(() => _status = 'Fuseau horaire invalide — réglez votre téléphone sur Yaoundé (UTC+1)');
          return;
        }

        // TODO: réactiver la vérification de zone en prod
        // final zones = await ApiService.verifyZone(
        //   bssid: _bssid,
        //   ssid: _ssid,
        //   ipLocale: _ipLocale,
        // );
        // if (zones['valide'] != true) {
        //   if (_bssid == null) {
        //   } else {
        //     final erreurs = (zones['erreurs'] as List?)?.join(', ') ?? 'BSSID non reconnu';
        //     setState(() => _status = 'Zone WiFi non autorisée: $erreurs');
        //     return;
        //   }
        // }

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
          final pinInput = await showDialog<String>(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('Code PIN'),
              content: TextField(
                controller: pinCtrl,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'PIN',
                  border: OutlineInputBorder(),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx, false as String?),
                  child: const Text('Annuler'),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.pop(ctx, pinCtrl.text),
                  child: const Text('Valider'),
                ),
              ],
            ),
          );
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
        if (!mounted) return;
        setState(() {
          _activeSessionId = session['id'];
          _status = 'Pointage enregistré';
        });
      } else {
        await ApiService.checkout(widget.user['id'] ?? widget.user['sub']);
        if (!mounted) return;
        setState(() {
          _activeSessionId = null;
          _status = 'Dépointage enregistré';
        });
      }
    } catch (e) {
      if (!mounted) return;
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
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Code PIN'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(label),
          ),
        ],
      ),
    ) ??
        false;
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Déconnexion'),
        content: const Text('Voulez-vous vraiment vous déconnecter ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Se déconnecter', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await AuthService.logout();
    if (!mounted) return;
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const LoginScreen()),
          (_) => false,
    );
  }

  String _formatTime(String? iso) {
    if (iso == null) return '--:--';
    final dt = DateTime.parse(iso);
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  String _formatDateRelative(String? iso) {
    if (iso == null) return '';
    final dt = DateTime.parse(iso);
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inDays == 0) return 'Aujourd\'hui';
    if (diff.inDays == 1) return 'Hier';
    final jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    final mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return '${jours[dt.weekday - 1]}, ${dt.day} ${mois[dt.month - 1]}';
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final name = widget.user['prenom'] != null ? '${widget.user['prenom']} ${widget.user['nom']}' : widget.user['email'];
    final isCheckedIn = _activeSessionId != null;
    final lastSession = _sessions.isNotEmpty ? _sessions.first as Map<String, dynamic>? : null;
    final lastArrivee = lastSession?['heure_arrivee'] as String?;

    return Scaffold(
      backgroundColor: cs.surface,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 16, 0),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Bonjour,', style: TextStyle(fontSize: 14, color: cs.onSurfaceVariant)),
                        const SizedBox(height: 2),
                        Text(
                          name,
                          style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: cs.onSurface),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.history, color: cs.onSurfaceVariant),
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => HistoryScreen(
                          userId: widget.user['id'] ?? widget.user['sub'],
                          user: widget.user,
                        ),
                      ),
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.logout, color: cs.onSurfaceVariant),
                    onPressed: _logout,
                  ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Column(
                  children: [
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(28),
                      decoration: BoxDecoration(
                        color: cs.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                            decoration: BoxDecoration(
                              color: isCheckedIn ? AppColors.success.withValues(alpha: 0.1) : AppColors.warning.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              isCheckedIn ? 'En Service' : 'Hors Service',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: isCheckedIn ? AppColors.success : AppColors.warning,
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          GestureDetector(
                            onTap: _checking ? null : () => _pointage(checkin: !isCheckedIn),
                            child: Container(
                              width: 96,
                              height: 96,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isCheckedIn ? AppColors.error : AppColors.primary,
                                boxShadow: [
                                  BoxShadow(
                                    color: (isCheckedIn ? AppColors.error : AppColors.primary).withValues(alpha: 0.3),
                                    blurRadius: 16,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Center(
                                child: _checking
                                    ? const SizedBox(
                                  width: 28,
                                  height: 28,
                                  child: CircularProgressIndicator(strokeWidth: 3, color: Colors.white),
                                )
                                    : Icon(
                                  isCheckedIn ? Icons.logout : Icons.login,
                                  size: 40,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(_status, style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: cs.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: AppColors.accent.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: const Icon(Icons.schedule, color: AppColors.accent, size: 24),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Dernier Pointage', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant)),
                                const SizedBox(height: 4),
                                Text(
                                  lastArrivee != null ? _formatTime(lastArrivee) : '--:--',
                                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: cs.onSurface),
                                ),
                                if (lastArrivee != null)
                                  Text(
                                    _formatDateRelative(lastArrivee),
                                    style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: cs.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: AppColors.success.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: const Icon(Icons.location_on, color: AppColors.success, size: 24),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _ssid ?? 'Non connecté',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: cs.onSurface),
                                ),
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    Container(
                                      width: 8,
                                      height: 8,
                                      decoration: const BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: AppColors.success,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    const Text(
                                      'Zone autorisée',
                                      style: TextStyle(fontSize: 13, color: AppColors.success),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.check_circle, color: AppColors.success, size: 20),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest,
                border: Border(top: BorderSide(color: AppColors.outlineVariant.withValues(alpha: 0.3))),
              ),
              child: Row(
                children: [
                  Icon(Icons.wifi, size: 16, color: _bssid != null ? AppColors.success : AppColors.error.withValues(alpha: 0.6)),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _ssid ?? 'Non connecté',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: cs.onSurface),
                        ),
                        Text(
                          _bssid != null ? 'BSSID: $_bssid' : 'WiFi indisponible',
                          style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant.withValues(alpha: 0.7)),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.refresh, size: 18),
                    onPressed: () async {
                      await _refreshNetworkInfo();
                      if (mounted) setState(() {});
                    },
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavBar(
        currentIndex: 0,
        onTap: (i) {
          if (i == 1) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (_) => ProfileScreen(user: widget.user)),
            );
          } else if (i == 2) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (_) => RequestsScreen(user: widget.user)),
            );
          } else if (i == 3) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (_) => SettingsScreen(user: widget.user)),
            );
          }
        },
      ),
    );
  }
}