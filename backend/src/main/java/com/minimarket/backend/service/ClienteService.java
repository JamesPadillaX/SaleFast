package com.minimarket.backend.service;

import com.minimarket.backend.model.Cliente;
import com.minimarket.backend.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ClienteService {

    @Autowired
    private ClienteRepository clienteRepository;

    public List<Cliente> obtenerTodos() {
        return clienteRepository.findAll();
    }

    public Cliente obtenerPorId(UUID id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
    }

    public Cliente obtenerPorDni(String dni) {
        return clienteRepository.findByDni(dni)
                .orElseThrow(() -> new RuntimeException("Cliente con DNI no encontrado"));
    }

    public Cliente guardar(Cliente cliente) {
        Optional<Cliente> existente = clienteRepository.findByDni(cliente.getDni());
        if (existente.isPresent()) {
            return existente.get(); // Retornar el cliente existente
        }
        return clienteRepository.save(cliente);
    }

    public Cliente actualizar(UUID id, Cliente clienteDetalles) {
        Cliente cliente = obtenerPorId(id);
        cliente.setNombre(clienteDetalles.getNombre());
        cliente.setDni(clienteDetalles.getDni());
        cliente.setTelefono(clienteDetalles.getTelefono());
        return clienteRepository.save(cliente);
    }

    public void eliminar(UUID id) {
        Cliente cliente = obtenerPorId(id);
        clienteRepository.delete(cliente);
    }
}
