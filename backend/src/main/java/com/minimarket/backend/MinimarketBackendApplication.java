package com.minimarket.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.util.TimeZone;

@SpringBootApplication
public class MinimarketBackendApplication {
    public static void main(String[] args) {
        // Fijar zona horaria a Perú (UTC-5) para que LocalDate.now() sea correcto
        TimeZone.setDefault(TimeZone.getTimeZone("America/Lima"));
        SpringApplication.run(MinimarketBackendApplication.class, args);
    }
}
