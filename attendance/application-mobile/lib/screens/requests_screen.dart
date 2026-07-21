import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/socket_service.dart';
import '../constants/app_colors.dart';
import '../widgets/bottom_nav_bar.dart';
import 'home_screen.dart';
import 'profile_screen.dart';
import 'settings_screen.dart';

class RequestsScreen extends StatefulWidget {
  final Map<String, dynamic> user;
  const RequestsScreen({super.key, required this.user});

  @override
  State<RequestsScreen> createState() => _RequestsScreenState();
}

class _RequestsScreenState extends State<RequestsScreen> {
  List<dynamic> _requests = [];
  bool _loading = true;
  String? _error;

  final SocketService _socket = SocketService();

  @override
  void initState() {
    super.initState();
    _load();
    _initSocket();
  }

  Future<void> _initSocket() async {
    final token = await AuthService.getToken();
    final userId = widget.user['id'] ?? widget.user['sub'];
    if (token == null || userId == null) return;
    _socket.connect(token: token, userId: userId.toString());
    _socket.on('demande:traitee', _onDemandeTraitee);
  }

  void _onDemandeTraitee(dynamic data) {
    if (!mounted) return;
    final demande = data as Map<String, dynamic>?;
    final statut = demande?['statut'] as String? ?? '';
    final acceptee = statut == 'approuve';
    final type = demande?['type'] as String? ?? 'Votre demande';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(acceptee ? '$type a été acceptée' : '$type a été refusée'),
        backgroundColor: acceptee ? AppColors.success : AppColors.error,
      ),
    );
    _load();
  }

  @override
  void dispose() {
    _socket.off('demande:traitee', _onDemandeTraitee);
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final requests = await ApiService.getMyRequests();
      if (!mounted) return;
      setState(() {
        _requests = requests;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  static const _statutLabels = {'en_attente': 'En attente', 'approuve': 'Approuvé', 'refuse': 'Refusé'};

  Color _statutColor(String statut) {
    switch (statut) {
      case 'approuve':
        return AppColors.success;
      case 'refuse':
        return AppColors.error;
      default:
        return AppColors.warmAccent;
    }
  }

  String _formatDate(DateTime? dt) {
    if (dt == null) return '';
    return DateFormat('dd/MM/yyyy').format(dt);
  }

  DateTime? _tryParse(String? iso) {
    if (iso == null) return null;
    try {
      return DateTime.parse(iso);
    } catch (_) {
      return null;
    }
  }

  String _formatPeriod(Map<String, dynamic> r) {
    final debut = _tryParse(r['dateDebut']);
    final fin = _tryParse(r['dateFin']);
    if (debut != null && fin != null) {
      return '${_formatDate(debut)} → ${_formatDate(fin)}';
    } else if (debut != null) {
      return _formatDate(debut);
    } else {
      final demande = _tryParse(r['dateDemande']);
      return demande != null ? _formatDate(demande) : '';
    }
  }

  Future<void> _showCreateRequestDialog() async {
    final typeCtrl = TextEditingController();
    final motifCtrl = TextEditingController();
    DateTime? dateDebut;
    DateTime? dateFin;
    bool submitting = false;

    // Capture le messenger du scaffold PRINCIPAL (pas du bottom sheet)
    final messenger = ScaffoldMessenger.of(context);

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) => Container(
            padding: EdgeInsets.only(
              left: 24,
              right: 24,
              top: 24,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            ),
            decoration: BoxDecoration(
              color: Theme.of(ctx).colorScheme.surfaceContainerHighest,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Nouvelle demande',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Theme.of(ctx).colorScheme.onSurface),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: typeCtrl,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: const InputDecoration(
                      labelText: 'Objet de la demande',
                      hintText: 'Ex : Congé, retard, matériel, formation, problème...',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.category_outlined),
                    ),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Veuillez indiquer l\'objet' : null,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          onTap: () async {
                            final picked = await showDatePicker(
                              context: ctx,
                              initialDate: dateDebut ?? DateTime.now(),
                              firstDate: DateTime.now().subtract(const Duration(days: 365)),
                              lastDate: DateTime.now().add(const Duration(days: 365)),
                            );
                            if (picked != null) setSheetState(() => dateDebut = picked);
                          },
                          child: InputDecorator(
                            decoration: const InputDecoration(
                              labelText: 'Date début (optionnel)',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.calendar_today_outlined),
                            ),
                            child: Text(dateDebut != null ? _formatDate(dateDebut) : 'Sélectionner'),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: InkWell(
                          onTap: () async {
                            final picked = await showDatePicker(
                              context: ctx,
                              initialDate: dateFin ?? (dateDebut ?? DateTime.now()),
                              firstDate: dateDebut ?? DateTime.now().subtract(const Duration(days: 365)),
                              lastDate: DateTime.now().add(const Duration(days: 365)),
                            );
                            if (picked != null) setSheetState(() => dateFin = picked);
                          },
                          child: InputDecorator(
                            decoration: const InputDecoration(
                              labelText: 'Date fin (optionnel)',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.calendar_today_outlined),
                            ),
                            child: Text(dateFin != null ? _formatDate(dateFin) : 'Sélectionner'),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: motifCtrl,
                    maxLines: 4,
                    minLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Motif *',
                      border: OutlineInputBorder(),
                      alignLabelWithHint: true,
                      hintText: 'Expliquez le motif de votre demande...',
                    ),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Motif requis' : null,
                  ),
                  const SizedBox(height: 20),
                  FilledButton(
                    onPressed: submitting
                        ? null
                        : () async {
                            if (typeCtrl.text.trim().isEmpty) {
                              messenger.showSnackBar(const SnackBar(content: Text('Veuillez indiquer l\'objet'), backgroundColor: AppColors.error));
                              return;
                            }
                            if (motifCtrl.text.trim().isEmpty) {
                              messenger.showSnackBar(const SnackBar(content: Text('Motif requis'), backgroundColor: AppColors.error));
                              return;
                            }
                            if (dateDebut != null && dateFin != null && dateFin!.isBefore(dateDebut!)) {
                              messenger.showSnackBar(const SnackBar(content: Text('La date de fin est avant la date de début'), backgroundColor: AppColors.error));
                              return;
                            }
                            setSheetState(() => submitting = true);
                            try {
                              await ApiService.createRequest(
                                type: typeCtrl.text.trim(),
                                dateDebut: dateDebut?.toIso8601String(),
                                dateFin: dateFin?.toIso8601String(),
                                motif: motifCtrl.text.trim(),
                              );
                              if (!mounted) return;
                              Navigator.pop(context);
                              messenger.showSnackBar(
                                const SnackBar(content: Text('Demande envoyée'), backgroundColor: AppColors.success),
                              );
                              _load();
                            } catch (e) {
                              if (!mounted) return;
                              messenger.showSnackBar(
                                SnackBar(content: Text('Erreur: $e'), backgroundColor: AppColors.error),
                              );
                            } finally {
                              if (mounted) setSheetState(() => submitting = false);
                            }
                          },
                    child: submitting
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Envoyer'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
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
            Text('Mes demandes', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: cs.onSurface)),
            Text('Vos demandes et leur statut', style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.error_outline, size: 48, color: AppColors.error.withValues(alpha: 0.7)),
                        const SizedBox(height: 16),
                        Text('Erreur de chargement', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: cs.onSurface)),
                        const SizedBox(height: 8),
                        Text(_error!, style: TextStyle(color: cs.onSurfaceVariant), textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        FilledButton.icon(
                          onPressed: _load,
                          icon: const Icon(Icons.refresh),
                          label: const Text('Réessayer'),
                        ),
                      ],
                    ),
                  ),
                )
              : _requests.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.event_note_outlined, size: 48, color: cs.onSurfaceVariant),
                          const SizedBox(height: 16),
                          Text('Aucune demande', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: cs.onSurface)),
                          const SizedBox(height: 8),
                          Text('Vous n\'avez pas encore fait de demande', style: TextStyle(color: cs.onSurfaceVariant)),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      color: AppColors.accent,
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        itemCount: _requests.length,
                        itemBuilder: (ctx, i) {
                          final r = _requests[i] as Map<String, dynamic>;
                          final statut = r['statut'] as String? ?? 'en_attente';
                          final type = r['type'] as String? ?? 'Demande';
                          final motif = r['motif'] as String? ?? '';
                          final commentaire = r['commentaire'] as String?;
                        final color = _statutColor(statut);

                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: cs.surfaceContainerHighest,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, 4)),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: color.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      _statutLabels[statut] ?? statut,
                                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Flexible(
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: AppColors.accent.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        type,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.accent),
                                      ),
                                    ),
                                  ),
                                  const Spacer(),
                                  Flexible(
                                    child: Text(
                                      _formatPeriod(r),
                                      textAlign: TextAlign.end,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(
                                motif,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(fontSize: 14, color: cs.onSurface),
                              ),
                              if (statut != 'en_attente' && commentaire != null && commentaire.isNotEmpty) ...[
                                const SizedBox(height: 12),
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: AppColors.surfaceContainerAlt,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: AppColors.outlineVariant.withValues(alpha: 0.3)),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Commentaire de l\'admin',
                                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.onSurfaceVariant),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        commentaire,
                                        style: TextStyle(fontSize: 13, color: AppColors.onSurface),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        );
                      },
                    ),
                  ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateRequestDialog,
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 4,
        child: const Icon(Icons.add),
      ),
      bottomNavigationBar: BottomNavBar(
        currentIndex: 2,
        onTap: (i) {
          if (i == 0) {
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => HomeScreen(user: widget.user)));
          } else if (i == 1) {
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => ProfileScreen(user: widget.user)));
          } else if (i == 3) {
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => SettingsScreen(user: widget.user)));
          }
        },
      ),
    );
  }
}
