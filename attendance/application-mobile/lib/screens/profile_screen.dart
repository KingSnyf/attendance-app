import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../constants/app_colors.dart';
import '../widgets/bottom_nav_bar.dart';
import 'login_screen.dart';
import 'home_screen.dart';
import 'requests_screen.dart';
import 'settings_screen.dart';

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
  String _prenom = '';
  String _nom = '';
  String _email = '';

  @override
  void initState() {
    super.initState();
    _prenom = widget.user['prenom'] ?? '';
    _nom = widget.user['nom'] ?? '';
    _email = widget.user['email'] ?? '';
    _nameCtrl.text = '$_prenom $_nom'.trim();
    _emailCtrl.text = _email;
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
      setState(() {
        _status = 'Profil mis à jour';
        _prenom = fresh['prenom'] ?? fresh['firstName'] ?? '';
        _nom = fresh['nom'] ?? fresh['lastName'] ?? '';
        _email = fresh['email'] ?? _email;
        _photoUrl = fresh['photo_url'] ?? _photoUrl;
      });
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
    final messenger = ScaffoldMessenger.of(context);
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
              await _saveProfile();
              if (!mounted) return;
              messenger.showSnackBar(
                SnackBar(content: Text(_status.isEmpty ? 'Profil mis à jour' : _status), backgroundColor: _status.startsWith('Erreur') ? AppColors.error : AppColors.success),
              );
            },
            child: _savingProfile ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Enregistrer'),
          ),
        ],
      ),
    );
  }

  void _showPasswordDialog() {
    final messenger = ScaffoldMessenger.of(context);
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
              await _changePassword();
              if (!mounted) return;
              Navigator.pop(context);
              messenger.showSnackBar(
                SnackBar(content: Text(_status.isEmpty ? 'Mot de passe changé' : _status), backgroundColor: _status.startsWith('Erreur') ? AppColors.error : AppColors.success),
              );
            },
            child: _changingPass ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Changer'),
          ),
        ],
      ),
    );
  }

  void _showPinDialog() {
    final currentPinCtrl = TextEditingController();
    final newPinCtrl = TextEditingController();
    final confirmPinCtrl = TextEditingController();
    bool loading = false;
    final messenger = ScaffoldMessenger.of(context);
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Changer le code PIN'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: currentPinCtrl,
                  obscureText: true,
                  keyboardType: TextInputType.number,
                  maxLength: 4,
                  decoration: const InputDecoration(
                    labelText: 'Code PIN actuel',
                    prefixIcon: Icon(Icons.pin),
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: newPinCtrl,
                  obscureText: true,
                  keyboardType: TextInputType.number,
                  maxLength: 4,
                  decoration: const InputDecoration(
                    labelText: 'Nouveau code PIN',
                    prefixIcon: Icon(Icons.pin_outlined),
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: confirmPinCtrl,
                  obscureText: true,
                  keyboardType: TextInputType.number,
                  maxLength: 4,
                  decoration: const InputDecoration(
                    labelText: 'Confirmer le nouveau',
                    prefixIcon: Icon(Icons.pin_outlined),
                    border: OutlineInputBorder(),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
            ElevatedButton(
              onPressed: loading
                  ? null
                  : () async {
                      if (newPinCtrl.text != confirmPinCtrl.text) {
                        messenger.showSnackBar(const SnackBar(content: Text('Les codes PIN ne correspondent pas'), backgroundColor: AppColors.error));
                        return;
                      }
                      if (newPinCtrl.text.length != 4) {
                        messenger.showSnackBar(const SnackBar(content: Text('Le code PIN doit contenir 4 chiffres'), backgroundColor: AppColors.error));
                        return;
                      }
                      setDialogState(() => loading = true);
                      try {
                        await ApiService.changePin(currentPin: currentPinCtrl.text, newPin: newPinCtrl.text);
                        if (!mounted) return;
                        Navigator.pop(context);
                        messenger.showSnackBar(const SnackBar(content: Text('Code PIN changé'), backgroundColor: AppColors.success));
                      } catch (e) {
                        if (!mounted) return;
                        messenger.showSnackBar(SnackBar(content: Text('Erreur: $e'), backgroundColor: AppColors.error));
                      } finally {
                        if (mounted) setDialogState(() => loading = false);
                      }
                    },
              child: loading ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Changer'),
            ),
          ],
        ),
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
    final cs = Theme.of(context).colorScheme;
    final fullName = '$_prenom $_nom'.trim();
    final role = widget.user['role'] as String? ?? 'employe';
    final roleLabel = role == 'admin' ? 'Administrateur' : role == 'gestionnaire' ? 'Gestionnaire' : 'Employé';

    return Scaffold(
      backgroundColor: cs.surface,
      body: SafeArea(
        child: Column(
          children: [
            // En-tête
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Row(
                children: [
                  Spacer(),
                  Text(
                    'AttendX',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: cs.onSurface),
                  ),
                  Spacer(),
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
                                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: cs.onSurface),
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
                    Text('Informations Personnelles', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant)),
                    const SizedBox(height: 12),
                    _ProfileInfoTile(
                      icon: Icons.email_outlined,
                      label: 'Email',
                      value: _email,
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
                    Text('Sécurité', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant)),
                    const SizedBox(height: 12),
                    Container(
                      decoration: BoxDecoration(
                        color: cs.surfaceContainerHighest,
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
                        title: Text('Mot de passe', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: cs.onSurface)),
                        subtitle: Text('Dernière modification récente', style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                        trailing: const Icon(Icons.chevron_right, color: AppColors.outlineVariant),
                        onTap: _showPasswordDialog,
                      ),
                    ),
                    const _ProfileDivider(),
                    Container(
                      decoration: BoxDecoration(
                        color: cs.surfaceContainerHighest,
                        borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(16), bottomRight: Radius.circular(16)),
                      ),
                      child: ListTile(
                        leading: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: AppColors.accent.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.pin, color: AppColors.accent, size: 20),
                        ),
                        title: Text('Code PIN', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: cs.onSurface)),
                        subtitle: Text('Utilisé pour le pointage', style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                        trailing: const Icon(Icons.chevron_right, color: AppColors.outlineVariant),
                        onTap: _showPinDialog,
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
        currentIndex: 1,
        onTap: (i) {
          if (i == 0) {
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => HomeScreen(user: widget.user)));
          } else if (i == 2) {
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => RequestsScreen(user: widget.user)));
          } else if (i == 3) {
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => SettingsScreen(user: widget.user)));
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
          Icon(icon, size: 20, color: Theme.of(context).colorScheme.onSurfaceVariant),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value, style: TextStyle(fontSize: 16, color: Theme.of(context).colorScheme.onSurface)),
                Text(label, style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.7))),
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
