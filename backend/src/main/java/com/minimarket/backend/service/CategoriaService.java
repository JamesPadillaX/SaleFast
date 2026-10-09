package com.minimarket.backend.service;

import com.minimarket.backend.model.Categoria;
import com.minimarket.backend.repository.CategoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

@Service
public class CategoriaService {

    @Autowired
    private CategoriaRepository categoriaRepository;

    public List<Categoria> obtenerTodas() {
        return categoriaRepository.findAll();
    }

    public Categoria obtenerPorId(UUID id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
    }

    public Categoria guardar(Categoria categoria) {
        return categoriaRepository.save(categoria);
    }

    public Categoria actualizar(UUID id, Categoria categoriaDetalles) {
        Categoria categoria = obtenerPorId(id);
        categoria.setNombre(categoriaDetalles.getNombre());
        categoria.setDescripcion(categoriaDetalles.getDescripcion());
        return categoriaRepository.save(categoria);
    }

    public void eliminar(UUID id) {
        Categoria categoria = obtenerPorId(id);
        categoriaRepository.delete(categoria);
    }
}
