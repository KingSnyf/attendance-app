import 'package:flutter/material.dart';
import '../services/api_service.dart';

class HistoryScreen extends StatefulWidget {
  final String userId;
  const HistoryScreen({super.key, required this.userId});

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

  String _format(String? iso) {
    if (iso == null) return 'En cours';
    final dt = DateTime.parse(iso);
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Historique')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _sessions.isEmpty
              ? const Center(child: Text('Aucun pointage'))
              : ListView.builder(
                  itemCount: _sessions.length,
                  itemBuilder: (ctx, i) {
                    final s = _sessions[i];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      child: ListTile(
                        leading: Icon(s['heure_depart'] == null ? Icons.play_arrow : Icons.check, color: s['heure_depart'] == null ? Colors.green : Colors.grey),
                        title: Text(_format(s['heure_arrivee'])),
                        subtitle: Text('Fin: ${_format(s['heure_depart'])}'),
                        trailing: Text(s['methode_validation'] ?? '-', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                      ),
                    );
                  },
                ),
    );
  }
}
