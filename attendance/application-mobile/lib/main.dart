import 'package:flutter/material.dart';
import 'constants/app_colors.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'services/auth_service.dart';
import 'services/socket_service.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await NotificationService().init();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AttendX',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: AppColors.surface,
        colorScheme: ColorScheme.light(
          primary: AppColors.primary,
          secondary: AppColors.accent,
          surface: AppColors.surface,
          error: AppColors.error,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
        ),
        snackBarTheme: SnackBarThemeData(
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      home: const AppLifecycleWrapper(child: SplashScreen()),
    );
  }
}

class AppLifecycleWrapper extends StatefulWidget {
  final Widget child;
  const AppLifecycleWrapper({super.key, required this.child});

  @override
  State<AppLifecycleWrapper> createState() => _AppLifecycleWrapperState();
}

class _AppLifecycleWrapperState extends State<AppLifecycleWrapper> with WidgetsBindingObserver {
  final SocketService _socket = SocketService();
  final NotificationService _notif = NotificationService();
  final List<Map<String, String>> _pendingNotifs = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _connectSocket();
  }

  Future<void> _connectSocket() async {
    final token = await AuthService.getToken();
    final user = await AuthService.getUser();
    if (token == null || user == null) return;
    final userId = (user['id'] ?? user['sub']).toString();
    _socket.connect(token: token, userId: userId);
    _socket.on('demande:traitee', _onDemandeTraitee);
  }

  void _onDemandeTraitee(dynamic data) {
    final demande = data as Map<String, dynamic>?;
    if (demande == null) return;
    final statut = demande['statut'] as String? ?? '';
    final type = demande['type'] as String? ?? 'Demande';

    _notif.showDemandeTraitee(
      id: (demande['id'] ?? DateTime.now().millisecondsSinceEpoch).hashCode,
      type: type,
      statut: statut,
    );

    final lifecycle = WidgetsBinding.instance.lifecycleState;
    if (lifecycle != AppLifecycleState.resumed) {
      _pendingNotifs.add({'type': type, 'statut': statut});
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) async {
    if (state == AppLifecycleState.resumed && _pendingNotifs.isNotEmpty) {
      if (!mounted) return;
      for (final n in _pendingNotifs) {
        final acceptee = n['statut'] == 'approuve';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${n['type']} a été ${acceptee ? 'acceptée' : 'refusée'}'),
            backgroundColor: acceptee ? AppColors.success : AppColors.error,
          ),
        );
      }
      _pendingNotifs.clear();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _socket.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final token = await AuthService.getToken();
    final user = await AuthService.getUser();
    if (!mounted) return;
    if (token != null && user != null) {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => HomeScreen(user: user)));
    } else {
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }
}
