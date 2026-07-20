import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../constants/app_colors.dart';
import '../widgets/bottom_nav_bar.dart';
import 'login_screen.dart';
import 'home_screen.dart';
import 'history_screen.dart';
import 'requests_screen.dart';

class ProfileScreen extends StatefulWidget {
  final Map<String, dynamic> user;
  const ProfileScreen({super.key, required this.user});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _currentPassCtrl = TextEditingController();
  final _newPassCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();

  bool _savingProfile = false;
  bool _changingPass = false;
  File? _pickedImage;
  String? _photoUrl;
  String _status = '';

  @override
  void initState() {
    super.initState();
    _nameCtrl.text = '${widget.user['prenom'] ?? ''} ${widget.user['nom'] ?? ''}'.trim();
    _emailCtrl.text = widget.user['email'] ?? '';
    _photoUrl = widget.user['photoUrl'];
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, maxWidth: 800, imageQuality: 80);
    if (picked != null) {
      setState(() => _pickedImage = File(picked.path));
    }
  }

  Future<void> _saveProfile() async {
    if (_nameCtrl.text.trim().isEmpty || _emailCtrl.text.trim().isEmpty) {
      setState(() => _status = 'Nom et email requis');
      return;
    }
    setState(() => _savingProfile = true);
    try {
      final parts = _nameCtrl.text.trim().split(' ');
      final prenom = parts.first;
      final nom = parts.length > 1 ? parts.sublist(1).join(' ') : '';

      final data = {
        'firstName': prenom,
        'lastName': nom,
        'email': _emailCtrl.text.trim(),
        if (_pickedImage != null) 'photoUrl': 'upload_pending',
      };

      await ApiService.updateProfile(data);

      if (_pickedImage != null) {
        await ApiService.uploadPhoto(_pickedImage!);
      }

      final fresh = await ApiService.getProfile();
      await AuthService.saveUser(fresh);

      if (!mounted) return;
      setState(() => _status = 'Profil mis à jour');
      Navigator.pop(context, true);
    } catch (e) {
      setState(() => _status = 'Erreur: $e');
    } finally {
      if (mounted) setState(() => _savingProfile = false);
    }
  }

  Future<void> _changePassword() async {
    if (_currentPassCtrl.text.isEmpty || _newPassCtrl.text.isEmpty || _confirmPassCtrl.text.isEmpty) {
      setState(() => _status = 'Tous les champs requis');
      return;
    }
    if (_newPassCtrl.text != _confirmPassCtrl.text) {
      setState(() => _status = 'Les mots de passe ne correspondent pas');
      return;
    }
    if (_newPassCtrl.text.length < 6) {
      setState(() => _status = 'Mot de passe trop court (min 6)');
      return;
    }
    setState(() => _changingPass = true);
    try {
      await ApiService.changePassword(
        currentPassword: _currentPassCtrl.text,
        newPassword: _newPassCtrl.text,
      );
      if (!mounted) return;
      _currentPassCtrl.clear();
      _newPassCtrl.clear();
      _confirmPassCtrl.clear();
      setState(() => _status = 'Mot de passe changé');
    } catch (e) {
      setState(() => _status = 'Erreur: $e');
    } finally {
      if (mounted) setState(() => _changingPass = false);
    }
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
    await AuthService.logout();
    if (!mounted) return;
    Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const LoginScreen()), (_) => false);
  }

  void _showEditProfileDialog() {
    final nameCtrl = TextEditingController(text: _nameCtrl.text);
    final emailCtrl = TextEditingController(text: _emailCtrl.text);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Modifier le profil'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildField(nameCtrl, 'Prénom et Nom', icon: Icons.person),
              const SizedBox(height: 12),
              _buildField(emailCtrl, 'Email', icon: Icons.email),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          ElevatedButton(
            onPressed: _savingProfile ? null : () async {
              _nameCtrl.text = nameCtrl.text;
              _emailCtrl.text = emailCtrl.text;
              final nav = Navigator.of(ctx);
              await _saveProfile();
              if (mounted) nav.pop();
            },
            child: _savingProfile ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Enregistrer'),
          ),
        ],
      ),
    );
  }

  void _showPasswordDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Changer le mot de passe'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: _currentPassCtrl,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Mot de passe actuel',
                  prefixIcon: Icon(Icons.lock),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _newPassCtrl,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Nouveau mot de passe',
                  prefixIcon: Icon(Icons.lock_outline),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _confirmPassCtrl,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Confirmer le nouveau',
                  prefixIcon: Icon(Icons.lock_outline),
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          ElevatedButton(
            onPressed: _changingPass ? null : () async {
              final nav = Navigator.of(ctx);
              await _changePassword();
              if (mounted) nav.pop();
            },
            child: _changingPass ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Changer'),
          ),
        ],
      ),
    );
  }

  Widget _buildField(TextEditingController ctrl, String label, {bool obscure = false, IconData? icon}) {
    return TextField(
      controller: ctrl,
      obscureText: obscure,
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        prefixIcon: icon != null ? Icon(icon) : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final prenom = widget.user['prenom'] ?? '';
    final nom = widget.user['nom'] ?? '';
    final fullName = '$prenom $nom'.trim();
    final email = widget.user['email'] ?? '';
    final role = widget.user['role'] as String? ?? 'employe';
    final roleLabel = role == 'admin' ? 'Administrateur' : role == 'gestionnaire' ? 'Gestionnaire' : 'Employé';

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Column(
          children: [
            // En-tête
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.menu, color: AppColors.onSurfaceVariant),
                    onPressed: () {},
                  ),
                  const Spacer(),
                  const Text(
                    'AttendX',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.onSurface),
                  ),
                  const Spacer(),
                  const SizedBox(width: 48),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Photo + nom + rôle
                    Center(
                      child: Column(
                        children: [
                          Stack(
                            children: [
                              CircleAvatar(
                                radius: 48,
                                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                                backgroundImage: _pickedImage != null
                                    ? FileImage(_pickedImage!)
                                    : (_photoUrl != null && _photoUrl!.isNotEmpty
                                        ? NetworkImage(_photoUrl!)
                                        : null) as ImageProvider?,
                                child: _pickedImage == null && (_photoUrl == null || _photoUrl!.isEmpty)
                                    ? const Icon(Icons.person, size: 44, color: AppColors.primary)
                                    : null,
                              ),
                              Positioned(
                                bottom: 0,
                                right: 0,
                                child: InkWell(
                                  onTap: _pickImage,
                                  child: Container(
                                    width: 32,
                                    height: 32,
                                    decoration: const BoxDecoration(
                                      color: AppColors.primary,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.edit, size: 16, color: Colors.white),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                fullName.isNotEmpty ? fullName : 'Sans nom',
                                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: AppColors.onSurface),
                              ),
                              const SizedBox(width: 8),
                              InkWell(
                                onTap: _showEditProfileDialog,
                                child: const Icon(Icons.edit, size: 18, color: AppColors.accent),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.accent.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              roleLabel,
                              style: const TextStyle(fontSize: 12, color: AppColors.accent, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),

                    // Informations Personnelles
                    const Text('Informations Personnelles', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.onSurfaceVariant)),
                    const SizedBox(height: 12),
                    _ProfileInfoTile(
                      icon: Icons.email_outlined,
                      label: 'Email',
                      value: email,
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.success.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text('Vérifié', style: TextStyle(fontSize: 11, color: AppColors.success, fontWeight: FontWeight.w600)),
                      ),
                    ),
                    const _ProfileDivider(),
                    _ProfileInfoTile(
                      icon: Icons.phone_outlined,
                      label: 'Téléphone',
                      value: 'Non défini',
                    ),
                    const _ProfileDivider(),
                    _ProfileInfoTile(
                      icon: Icons.location_on_outlined,
                      label: 'Localisation',
                      value: 'Yaoundé, Cameroun',
                    ),
                    const SizedBox(height: 24),

                    // Sécurité
                    const Text('Sécurité', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.onSurfaceVariant)),
                    const SizedBox(height: 12),
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.surfaceContainer,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: ListTile(
                        leading: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: AppColors.warmAccent.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.lock_reset, color: AppColors.warmAccent, size: 20),
                        ),
                        title: const Text('Mot de passe', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.onSurface)),
                        subtitle: const Text('Dernière modification récente', style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
                        trailing: const Icon(Icons.chevron_right, color: AppColors.outlineVariant),
                        onTap: _showPasswordDialog,
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Préférences
                    const Text('Préférences', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.onSurfaceVariant)),
                    const SizedBox(height: 12),
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.surfaceContainer,
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
                            title: const Text('Notifications Push', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.onSurface)),
                            value: true,
                            onChanged: (_) {},
                            activeTrackColor: AppColors.accent.withValues(alpha: 0.3), activeThumbColor: AppColors.accent,
                          ),
                          const _ProfileDivider(),
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
                            title: const Text('Mode Sombre', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.onSurface)),
                            value: false,
                            onChanged: (_) {},
                            activeTrackColor: AppColors.primary.withValues(alpha: 0.3), activeThumbColor: AppColors.primary,
                          ),
                          const _ProfileDivider(),
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
                            title: const Text('Langue', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.onSurface)),
                            subtitle: const Text('Français', style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
                            trailing: const Icon(Icons.chevron_right, color: AppColors.outlineVariant),
                            onTap: () {},
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Déconnexion
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

                    if (_status.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: Text(
                          _status,
                          style: TextStyle(
                            color: _status.startsWith('Erreur') ? AppColors.error : AppColors.success,
                            fontSize: 13,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
bottomNavigationBar: BottomNavBar(
        currentIndex: 2,
        onTap: (i) {
          if (i == 0) {
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => HomeScreen(user: widget.user)));
          } else if (i == 1) {
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => HistoryScreen(userId: widget.user['id'] ?? widget.user['sub'], user: widget.user)));
          } else if (i == 3) {
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => RequestsScreen(user: widget.user)));
          } else if (i == 4) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Paramètres à venir')));
          }
        },
      ),
    );
  }
}

class _ProfileInfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Widget? trailing;

  const _ProfileInfoTile({required this.icon, required this.label, required this.value, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppColors.onSurfaceVariant),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value, style: const TextStyle(fontSize: 16, color: AppColors.onSurface)),
                Text(label, style: TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant.withValues(alpha: 0.7))),
              ],
            ),
          ),
          if (trailing != null) trailing ?? const SizedBox(),
        ],
      ),
    );
  }
}

class _ProfileDivider extends StatelessWidget {
  const _ProfileDivider();

  @override
  Widget build(BuildContext context) {
    return Divider(height: 1, indent: 54, color: AppColors.outlineVariant.withValues(alpha: 0.3));
  }
}
