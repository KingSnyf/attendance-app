import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'constants/app_colors.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'services/auth_service.dart';
import 'services/api_service.dart';
import 'services/socket_service.dart';
import 'services/notification_service.dart';
import 'services/theme_service.dart';
import 'services/locale_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiService.init();
  await NotificationService().init();
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  void _onThemeOrLocaleChanged() {
    if (!mounted) return;
    setState(() {});
  }

  @override
  void initState() {
    super.initState();
    ThemeService.themeMode.addListener(_onThemeOrLocaleChanged);
    LocaleService.locale.addListener(_onThemeOrLocaleChanged);
  }

  @override
  void dispose() {
    ThemeService.themeMode.removeListener(_onThemeOrLocaleChanged);
    LocaleService.locale.removeListener(_onThemeOrLocaleChanged);
    super.dispose();
  }

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
          onSurface: AppColors.onSurface,
        ).copyWith(
          onSurfaceVariant: AppColors.onSurfaceVariant,
          surfaceContainerHighest: AppColors.surfaceContainer,
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
      darkTheme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF121212),
        colorScheme: ColorScheme.dark(
          primary: const Color(0xFF9EC7FF),
          secondary: const Color(0xFF66B2FF),
          surface: const Color(0xFF1E1E1E),
          error: const Color(0xFFFFB4AB),
          onSurface: const Color(0xFFE6E1E5),
        ).copyWith(
          onSurfaceVariant: const Color(0xFFCAC4D0),
          surfaceContainerHighest: const Color(0xFF2C2C2C),
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
      themeMode: ThemeService.themeMode.value,
      locale: LocaleService.locale.value,
      supportedLocales: const [Locale('fr'), Locale('en')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: const SplashScreen(),
    );
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  bool _didNavigate = false;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final token = await AuthService.getToken();
    final user = await AuthService.getUser();
    if (!mounted || _didNavigate) return;

    _didNavigate = true;
    if (token != null && user != null) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => HomeScreen(user: user)),
      );
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}