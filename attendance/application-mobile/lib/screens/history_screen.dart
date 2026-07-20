import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../constants/app_colors.dart';

class HistoryScreen extends StatefulWidget {
  final String userId;
  final Map<String, dynamic>? user;
  const HistoryScreen({super.key, required this.userId, this.user});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  List<dynamic> _sessions = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final sessions = await ApiService.getMySessions(widget.userId);
      setState(() {
        _sessions = sessions;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  String _formatShortDate(String? iso) {
    if (iso == null) return '';
    final dt = DateTime.parse(iso);
    final now = DateTime.now();
    final diff = now.difference(dt);
    final jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    final mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    if (diff.inDays == 0) return 'Aujourd\'hui';
    if (diff.inDays == 1) return 'Hier';
    return '${jours[dt.weekday - 1]}, ${dt.day} ${mois[dt.month - 1]}';
  }

  double _calcEfficacite() {
    if (_sessions.isEmpty) return 0;
    final total = _sessions.length;
    final terminees = _sessions.where((s) => s['heure_depart'] != null).length;
    return total > 0 ? (terminees / total) * 100 : 0;
  }

  double _totalHours() {
    double hours = 0;
    for (final s in _sessions) {
      if (s['heure_arrivee'] != null && s['heure_depart'] != null) {
        final a = DateTime.parse(s['heure_arrivee']);
        final d = DateTime.parse(s['heure_depart']);
        hours += d.difference(a).inMinutes / 60;
      }
    }
    return hours;
  }

  @override
  Widget build(BuildContext context) {
    final eff = _calcEfficacite();
    final totalH = _totalHours();
    final h = totalH.floor();
    final m = ((totalH - h) * 60).round();

    final Map<String, List<dynamic>> grouped = {};
    for (final s in _sessions) {
      final key = s['heure_arrivee'] != null ? _formatShortDate(s['heure_arrivee']) : 'Inconnu';
      grouped.putIfAbsent(key, () => []).add(s);
    }
    final keys = grouped.keys.toList();

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Historique', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: AppColors.onSurface)),
            Text('Suivi de vos pointages récents', style: TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant)),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _sessions.isEmpty
              ? const Center(child: Text('Aucun pointage', style: TextStyle(color: AppColors.onSurfaceVariant)))
              : Column(
                  children: [
                    // Cartes stats
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      child: Row(
                        children: [
                          Expanded(
                            child: _StatCard(
                              label: 'Efficacité',
                              value: '${eff.round()}%',
                              trend: eff >= 70 ? 'positive' : 'negative',
                              color: AppColors.accent,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _StatCard(
                              label: 'Ponctualité',
                              value: eff >= 80 ? 'Excellente' : eff >= 50 ? 'Moyenne' : 'Faible',
                              color: eff >= 80 ? AppColors.success : AppColors.warmAccent,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _StatCard(
                              label: 'Heures Total',
                              value: '${h}h ${m}m',
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Liste
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                        itemCount: keys.length,
                        itemBuilder: (ctx, i) {
                          final dateKey = keys[i];
                          final items = grouped[dateKey]!;
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                child: Text(
                                  dateKey,
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.onSurfaceVariant),
                                ),
                              ),
                              ...items.map((s) => _SessionTile(s: s)),
                            ],
                          );
                        },
                      ),
                    ),
                  ],
                ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final String? trend;

  const _StatCard({required this.label, required this.value, required this.color, this.trend});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainer,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant.withValues(alpha: 0.8))),
          const SizedBox(height: 6),
          Row(
            children: [
              Expanded(
                child: Text(
                  value,
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: color),
                ),
              ),
              if (trend != null)
                Icon(
                  trend == 'positive' ? Icons.trending_up : Icons.trending_down,
                  size: 16,
                  color: trend == 'positive' ? AppColors.success : AppColors.error,
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SessionTile extends StatelessWidget {
  final Map<String, dynamic> s;
  const _SessionTile({required this.s});

  @override
  Widget build(BuildContext context) {
    final arrivee = s['heure_arrivee'] as String?;
    final depart = s['heure_depart'] as String?;

    // Heure de début
    String heureArrivee = '--:--';
    if (arrivee != null) {
      final dt = DateTime.parse(arrivee);
      heureArrivee = '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    }
    String heureDepart = '--:--';
    if (depart != null) {
      final dt = DateTime.parse(depart);
      heureDepart = '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    }

    bool estEnRetard = false;
    if (arrivee != null) {
      final dt = DateTime.parse(arrivee);
      estEnRetard = dt.hour > 8 || (dt.hour == 8 && dt.minute > 15);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainer,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: depart == null ? AppColors.warning.withValues(alpha: 0.1) : AppColors.success.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              depart == null ? Icons.play_arrow : Icons.check,
              color: depart == null ? AppColors.warning : AppColors.success,
              size: 22,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text('Bureau', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.onSurface)),
                    if (estEnRetard) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.error.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text('En retard', style: TextStyle(fontSize: 11, color: AppColors.error, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '$heureArrivee → $heureDepart',
                  style: TextStyle(fontSize: 13, color: AppColors.onSurfaceVariant),
                ),
              ],
            ),
          ),
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerAlt,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.chevron_right, size: 18, color: AppColors.outlineVariant),
          ),
        ],
      ),
    );
  }
}
