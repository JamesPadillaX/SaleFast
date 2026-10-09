package com.minimarket.backend.controller;

import com.minimarket.backend.model.Rol;
import com.minimarket.backend.model.Usuario;
import com.minimarket.backend.repository.RolRepository;
import com.minimarket.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listar() {
        List<Map<String, Object>> response = usuarioRepository.findAll().stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("nombre", u.getNombre());
            map.put("rol", u.getRol());
            map.put("activo", u.getActivo());
            map.put("fechaCreacion", u.getFechaCreacion());
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/roles")
    public ResponseEntity<List<Rol>> listarRoles() {
        return ResponseEntity.ok(rolRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, Object> body) {
        String username = (String) body.get("username");
        String password = (String) body.get("password");
        String nombre = (String) body.get("nombre");
        UUID rolId = body.get("rolId") != null ? UUID.fromString(body.get("rolId").toString()) : null;

        if (username == null || password == null || nombre == null || rolId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Todos los campos son obligatorios"));
        }

        if (usuarioRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El usuario ya existe"));
        }

        Optional<Rol> rolOpt = rolRepository.findById(rolId);
        if (rolOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Rol no encontrado"));
        }

        Usuario usuario = new Usuario();
        usuario.setUsername(username.trim());
        usuario.setPassword(passwordEncoder.encode(password));
        usuario.setNombre(nombre.trim());
        usuario.setRol(rolOpt.get());
        usuario.setActivo(true);
        usuario.setFechaCreacion(LocalDateTime.now());

        Usuario guardado = usuarioRepository.save(usuario);

        Map<String, Object> res = new HashMap<>();
        res.put("id", guardado.getId());
        res.put("username", guardado.getUsername());
        res.put("nombre", guardado.getNombre());
        res.put("rol", guardado.getRol());
        res.put("activo", guardado.getActivo());
        return ResponseEntity.ok(res);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        Optional<Usuario> userOpt = usuarioRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Usuario usuario = userOpt.get();
        if (body.containsKey("nombre")) {
            usuario.setNombre(((String) body.get("nombre")).trim());
        }
        if (body.containsKey("password") && body.get("password") != null && !((String) body.get("password")).isBlank()) {
            usuario.setPassword(passwordEncoder.encode((String) body.get("password")));
        }
        if (body.containsKey("rolId")) {
            UUID rolId = UUID.fromString(body.get("rolId").toString());
            rolRepository.findById(rolId).ifPresent(usuario::setRol);
        }
        if (body.containsKey("activo")) {
            usuario.setActivo(Boolean.valueOf(body.get("activo").toString()));
        }

        Usuario guardado = usuarioRepository.save(usuario);
        Map<String, Object> res = new HashMap<>();
        res.put("id", guardado.getId());
        res.put("username", guardado.getUsername());
        res.put("nombre", guardado.getNombre());
        res.put("rol", guardado.getRol());
        res.put("activo", guardado.getActivo());
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable UUID id) {
        Optional<Usuario> userOpt = usuarioRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Usuario u = userOpt.get();
        u.setActivo(false);
        usuarioRepository.save(u);
        return ResponseEntity.noContent().build();
    }
}
