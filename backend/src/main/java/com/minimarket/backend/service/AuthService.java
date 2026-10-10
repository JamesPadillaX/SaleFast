package com.minimarket.backend.service;

import com.minimarket.backend.config.JwtUtils;
import com.minimarket.backend.model.Usuario;
import com.minimarket.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;


@Service
public class AuthService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    public Map<String, Object> login(String username, String password) {
        Optional<Usuario> userOpt = usuarioRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            Usuario usuario = userOpt.get();
            String storedPassword = usuario.getPassword();
            boolean isBcrypt = storedPassword != null && storedPassword.startsWith("$2");

            boolean matches;
            if (isBcrypt) {
                // Password is already BCrypt-encoded — verify normally
                matches = passwordEncoder.matches(password, storedPassword);
            } else {
                // Password is stored as plaintext — compare directly, then migrate
                matches = password.equals(storedPassword);
                if (matches && Boolean.TRUE.equals(usuario.getActivo())) {
                    // One-time migration: encode plaintext password to BCrypt
                    try {
                        usuario.setPassword(passwordEncoder.encode(password));
                        usuarioRepository.save(usuario);
                    } catch (Exception e) {
                        // If migration fails, still allow login
                    }
                }
            }

            if (Boolean.TRUE.equals(usuario.getActivo()) && matches) {
                String token = jwtUtils.generateToken(usuario.getUsername(), usuario.getRol().getNombre());
                Map<String, Object> response = new HashMap<>();
                response.put("token", token);
                response.put("username", usuario.getUsername());
                response.put("nombre", usuario.getNombre());
                response.put("rol", usuario.getRol().getNombre());
                response.put("id", usuario.getId());
                return response;
            }
        }
        throw new RuntimeException("Credenciales incorrectas o usuario inactivo");
    }

    public Usuario findByUsername(String username) {
        return usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }
}
