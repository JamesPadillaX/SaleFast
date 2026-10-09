package com.minimarket.backend.service;

import com.minimarket.backend.model.Proveedor;
import com.minimarket.backend.repository.ProveedorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

@Service
public class ProveedorService {

    @Autowired
    private ProveedorRepository proveedorRepository;

    public List<Proveedor> obtenerTodos() {
        return proveedorRepository.findAll();
    }

    public Proveedor obtenerPorId(UUID id) {
        return proveedorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
    }

    public Proveedor obtenerPorRuc(String ruc) {
        return proveedorRepository.findByRuc(ruc)
                .orElseThrow(() -> new RuntimeException("Proveedor con RUC no encontrado"));
    }

    public Proveedor guardar(Proveedor proveedor) {
        return proveedorRepository.save(proveedor);
    }

    public Proveedor actualizar(UUID id, Proveedor proveedorDetalles) {
        Proveedor proveedor = obtenerPorId(id);
        proveedor.setNombre(proveedorDetalles.getNombre());
        proveedor.setRuc(proveedorDetalles.getRuc());
        proveedor.setTelefono(proveedorDetalles.getTelefono());
        proveedor.setDireccion(proveedorDetalles.getDireccion());
        proveedor.setCorreo(proveedorDetalles.getCorreo());
        return proveedorRepository.save(proveedor);
    }

    public void eliminar(UUID id) {
        Proveedor proveedor = obtenerPorId(id);
        proveedorRepository.delete(proveedor);
    }
}
