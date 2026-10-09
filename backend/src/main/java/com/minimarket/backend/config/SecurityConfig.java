package com.minimarket.backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Acceso público a Swagger y Auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

                // Empleado y Admin pueden listar categorías y clientes
                .requestMatchers(HttpMethod.GET, "/api/categorias", "/api/categorias/**").hasAnyRole("ADMIN", "EMPLOYEE")
                .requestMatchers(HttpMethod.GET, "/api/clientes", "/api/clientes/**").hasAnyRole("ADMIN", "EMPLOYEE")
                .requestMatchers(HttpMethod.POST, "/api/clientes", "/api/clientes/**").hasAnyRole("ADMIN", "EMPLOYEE")

                // Empleado y Admin pueden ver productos
                .requestMatchers(HttpMethod.GET, "/api/productos", "/api/productos/**").hasAnyRole("ADMIN", "EMPLOYEE")

                // Empleado y Admin pueden registrar ventas
                .requestMatchers(HttpMethod.POST, "/api/ventas", "/api/ventas/**").hasAnyRole("ADMIN", "EMPLOYEE")
                .requestMatchers(HttpMethod.GET, "/api/ventas", "/api/ventas/**").hasAnyRole("ADMIN", "EMPLOYEE")

                // Inventario: Admin y Employee pueden registrar y ver movimientos
                .requestMatchers("/api/inventario/**").hasAnyRole("ADMIN", "EMPLOYEE")

                // Gestión de Categorías (crear, editar, eliminar) solo Admin
                .requestMatchers(HttpMethod.POST, "/api/categorias", "/api/categorias/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/categorias/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/categorias/**").hasRole("ADMIN")

                // Dashboard de métricas accesible para Administradores y Cajeros
                .requestMatchers("/api/reportes/dashboard").hasAnyRole("ADMIN", "EMPLOYEE")
                .requestMatchers("/api/reportes/**").hasRole("ADMIN")
                .requestMatchers("/api/compras/**").hasRole("ADMIN")
                .requestMatchers("/api/proveedores/**").hasRole("ADMIN")
                .requestMatchers("/api/usuarios/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/productos", "/api/productos/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/productos/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/productos/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Orígenes permitidos: web local (Vite), posibles puertos alternativos y app móvil
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"));
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setAllowCredentials(false);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
