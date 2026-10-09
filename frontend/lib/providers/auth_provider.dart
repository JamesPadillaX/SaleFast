import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  String? _token;
  String? _username;
  String? _nombre;
  String? _rol;
  int? _userId;
  bool _isLoading = false;
  String? _errorMessage;

  String? get token => _token;
  String? get username => _username;
  String? get nombre => _nombre;
  String? get rol => _rol;
  int? get userId => _userId;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  bool get isAuthenticated => _token != null;
  bool get isAdmin => _rol == 'ROLE_ADMIN';

  AuthProvider() {
    _cargarSesion();
  }

  Future<void> _cargarSesion() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    _username = prefs.getString('username');
    _nombre = prefs.getString('nombre');
    _rol = prefs.getString('rol');
    _userId = prefs.getInt('userId');
    notifyListeners();
  }

  Future<bool> login(String username, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await ApiService.post('/auth/login', {
        'username': username,
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _token = data['token'];
        _username = data['username'];
        _nombre = data['nombre'];
        _rol = data['rol'];
        _userId = data['id'];

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', _token!);
        await prefs.setString('username', _username!);
        await prefs.setString('nombre', _nombre!);
        await prefs.setString('rol', _rol!);
        await prefs.setInt('userId', _userId!);

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        final data = json.decode(response.body);
        _errorMessage = data['message'] ?? 'Error de autenticación';
      }
    } catch (e) {
      _errorMessage = 'No se pudo conectar con el servidor';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<void> logout() async {
    _token = null;
    _username = null;
    _nombre = null;
    _rol = null;
    _userId = null;

    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    notifyListeners();
  }
}
