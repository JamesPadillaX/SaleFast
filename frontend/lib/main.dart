import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/inventory_provider.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
        ChangeNotifierProvider(create: (_) => InventoryProvider()),
      ],
      child: const MinimarketApp(),
    ),
  );
}

class MinimarketApp extends StatelessWidget {
  const MinimarketApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        return MaterialApp(
          title: 'Minimarket POS',
          debugShowCheckedModeBanner: false,
          themeMode: ThemeMode.system, // Cambia automáticamente según sistema
          theme: ThemeData(
            useMaterial3: true,
            brightness: Brightness.light,
            colorScheme: ColorScheme.fromSeed(
              seedColor: const Color(0xFF673AB7), // Púrpura Premium
              brightness: Brightness.light,
              primary: const Color(0xFF673AB7),
              secondary: const Color(0xFF00BFA5), // Teal vibrante
            ),
            textTheme: GoogleFonts.outfitTextTheme(ThemeData.light().textTheme),
            cardTheme: CardTheme(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
          darkTheme: ThemeData(
            useMaterial3: true,
            brightness: Brightness.dark,
            colorScheme: ColorScheme.fromSeed(
              seedColor: const Color(0xFF673AB7),
              brightness: Brightness.dark,
              primary: const Color(0xFF9575CD),
              secondary: const Color(0xFF64FFDA),
            ),
            textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme),
            cardTheme: CardTheme(
              elevation: 4,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
          home: auth.isAuthenticated ? const DashboardScreen() : const LoginScreen(),
        );
      },
    );
  }
}
