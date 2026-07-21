import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/theme_service.dart';
import '../services/locale_service.dart';
import '../constants/app_colors.dart';
import '../widgets/bottom_nav_bar.dart';
import 'home_screen.dart';
import 'profile_screen.dart';
import 'requests_screen.dart';
import 'login_screen.dart';

class SettingsScreen extends StatefulWidget {
  final Map<String, dynamic> user;
  const SettingsScreen({super.key, required this.user});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _notifications = true;

  @override
  void initState() {
    super.initState();
    ThemeService.themeMode.addListener(() => setState(() {}));
    LocaleService.locale.addListener(() => setState(() {}));
  }

  String get currentLang {
    switch (LocaleService.locale.value.languageCode) {
      case 'en': return 'English';
      default: return 'Français';
    }
  }

  void _showLanguePicker() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(Icons.check, color: LocaleService.locale.value.languageCode == 'fr' ? AppColors.accent : Colors.transparent),
              title: const Text('Français'),
              onTap: () { LocaleService.setLocale('fr'); Navigator.pop(ctx); },
            ),
            ListTile(
              leading: Icon(Icons.check, color: LocaleService.locale.value.languageCode == 'en' ? AppColors.accent : Colors.transparent),
              title: const Text('English'),
              onTap: () { LocaleService.setLocale('en'); Navigator.pop(ctx); },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Déconnexion'),
        content: const Text('Voulez-vous vraiment vous déconnecter ?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Se déconnecter', style: TextStyle(color: AppColors.error))),
        ],
      ),
    );
    if (confirmed != true) return;
    await ApiService.logout();
    if (!mounted) return;
    Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const LoginScreen()), (_) => false);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: cs.surface,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Paramètres', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: cs.onSurface)),
            Text('Gérez votre compte et vos préférences', style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Compte', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant)),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.accent.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.person_outline, color: AppColors.accent, size: 20),
                    ),
                    title: Text('Mon profil', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: cs.onSurface)),
                    subtitle: Text('Informations personnelles', style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                    trailing: Icon(Icons.chevron_right, color: AppColors.outlineVariant),
                    onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => ProfileScreen(user: widget.user))),
                  ),
                  const _SettingsDivider(),
                  ListTile(
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.warmAccent.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.lock_reset, color: AppColors.warmAccent, size: 20),
                    ),
                    title: Text('Sécurité', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: cs.onSurface)),
                    subtitle: Text('Mot de passe et code PIN', style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                    trailing: Icon(Icons.chevron_right, color: AppColors.outlineVariant),
                    onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => ProfileScreen(user: widget.user))),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text('Préférences', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant)),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  SwitchListTile(
                    secondary: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.accent.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.notifications_outlined, color: AppColors.accent, size: 20),
                    ),
                    title: Text('Notifications Push', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: cs.onSurface)),
                    value: _notifications,
                    onChanged: (v) => setState(() => _notifications = v),
                    activeTrackColor: AppColors.accent.withValues(alpha: 0.3),
                    activeThumbColor: AppColors.accent,
                  ),
                  const _SettingsDivider(),
                  SwitchListTile(
                    secondary: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.dark_mode_outlined, color: AppColors.primary, size: 20),
                    ),
                    title: Text('Mode Sombre', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: cs.onSurface)),
                    value: ThemeService.isDark,
                    onChanged: (v) => ThemeService.setDark(v),
                    activeTrackColor: AppColors.primary.withValues(alpha: 0.3),
                    activeThumbColor: AppColors.primary,
                  ),
                  const _SettingsDivider(),
                  ListTile(
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.warmAccent.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.language, color: AppColors.warmAccent, size: 20),
                    ),
                    title: Text('Langue', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: cs.onSurface)),
                    subtitle: Text(currentLang, style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                    trailing: Icon(Icons.chevron_right, color: AppColors.outlineVariant),
                    onTap: _showLanguePicker,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: OutlinedButton.icon(
                onPressed: _logout,
                icon: const Icon(Icons.logout, color: AppColors.error),
                label: const Text(
                  'Déconnexion du Compte',
                  style: TextStyle(fontSize: 15, color: AppColors.error, fontWeight: FontWeight.w600),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.error, width: 1.5),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(26),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavBar(
        currentIndex: 3,
        onTap: (i) {
          if (i == 0) {
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => HomeScreen(user: widget.user)));
          } else if (i == 1) {
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => ProfileScreen(user: widget.user)));
          } else if (i == 2) {
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => RequestsScreen(user: widget.user)));
          }
        },
      ),
    );
  }
}

class _SettingsDivider extends StatelessWidget {
  const _SettingsDivider();

  @override
  Widget build(BuildContext context) {
    return Divider(height: 1, indent: 54, color: AppColors.outlineVariant.withValues(alpha: 0.3));
  }
}
