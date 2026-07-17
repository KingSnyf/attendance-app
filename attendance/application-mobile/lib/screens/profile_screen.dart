import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

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
    return Scaffold(
      appBar: AppBar(title: const Text('Mon profil')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Photo + nom
            Center(
              child: Column(
                children: [
                  Stack(
                    children: [
                      CircleAvatar(
                        radius: 50,
                        backgroundImage: _pickedImage != null
                            ? FileImage(_pickedImage!)
                            : (_photoUrl != null && _photoUrl!.isNotEmpty
                                ? NetworkImage(_photoUrl!)
                                : null) as ImageProvider?,
                        child: _pickedImage == null && (_photoUrl == null || _photoUrl!.isEmpty)
                            ? const Icon(Icons.person, size: 50)
                            : null,
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: InkWell(
                          onTap: _pickImage,
                          child: const CircleAvatar(
                            radius: 18,
                            backgroundColor: Colors.orange,
                            child: Icon(Icons.camera_alt, size: 18, color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _nameCtrl.text.isEmpty ? 'Sans nom' : _nameCtrl.text,
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  Text(_emailCtrl.text, style: const TextStyle(color: Colors.grey)),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Infos personnelles
            const Text('Informations personnelles', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            _buildField(_nameCtrl, 'Prénom et Nom', icon: Icons.person),
            const SizedBox(height: 16),
            _buildField(_emailCtrl, 'Email', icon: Icons.email, obscure: false),
            const SizedBox(height: 24),

            ElevatedButton.icon(
              icon: _savingProfile
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.save),
              label: Text(_savingProfile ? 'Enregistrement...' : 'Enregistrer'),
              onPressed: _savingProfile ? null : _saveProfile,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 48),
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
              ),
            ),
            const SizedBox(height: 32),

            // Changement mot de passe
            const Divider(),
            const Text('Changer le mot de passe', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            _buildField(_currentPassCtrl, 'Mot de passe actuel', obscure: true, icon: Icons.lock),
            const SizedBox(height: 12),
            _buildField(_newPassCtrl, 'Nouveau mot de passe', obscure: true, icon: Icons.lock_outline),
            const SizedBox(height: 12),
            _buildField(_confirmPassCtrl, 'Confirmer le nouveau', obscure: true, icon: Icons.lock_outline),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              icon: _changingPass
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.lock_reset),
              label: Text(_changingPass ? 'Modification...' : 'Changer le mot de passe'),
              onPressed: _changingPass ? null : _changePassword,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 48),
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
              ),
            ),

            if (_status.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(_status, style: TextStyle(color: _status.startsWith('Erreur') ? Colors.red : Colors.green)),
            ],
          ],
        ),
      ),
    );
  }
}