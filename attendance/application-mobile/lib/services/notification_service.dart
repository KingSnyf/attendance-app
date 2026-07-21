import 'dart:ui' show Color;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();

  Future<void> init() async {
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    await _plugin.initialize(
      const InitializationSettings(android: android, iOS: ios),
      onDidReceiveNotificationResponse: _onTap,
    );
  }

  void _onTap(NotificationResponse response) {
    // L'utilisateur a tapé la notification — la navigation sera gérée par l'app
  }

  Future<void> showDemandeTraitee({
    required int id,
    required String type,
    required String statut,
  }) async {
    final acceptee = statut == 'approuve';
    final title = 'Demande $statut';
    final body = acceptee ? '$type a été acceptée' : '$type a été refusée';

    final androidDetails = AndroidNotificationDetails(
      'demandes',
      'Demandes',
      channelDescription: 'Notifications de demandes approuvées/refusées',
      importance: Importance.high,
      priority: Priority.high,
      color: const Color(0xFF131B2E),
    );
    const iosDetails = DarwinNotificationDetails();

    await _plugin.show(
      id,
      title,
      body,
      NotificationDetails(android: androidDetails, iOS: iosDetails),
    );
  }
}
