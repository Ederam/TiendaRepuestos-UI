/**
 * @fileoverview Adaptador en memoria con clientes de prueba para desarrollo local.
 */

import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ClienteService } from './cliente.service';
import { Cliente, CreateClienteRequest } from '../../models/cliente.models';

@Injectable()
export class ClienteMockService extends ClienteService {
  private clientesEnMemoria: Cliente[] = [
    {
      id: 1,
      documento: '1018456789',
      nombre: 'Taller Autos del Norte',
      telefono: '3105551234',
      correo: 'autosdelnorte@gmail.com',
      direccion: 'Calle 68 # 28-10',
      esFacturaElectronica: true,
    },
    {
      id: 2,
      documento: '80123456',
      nombre: 'Carlos Andrés Pérez',
      telefono: '3209876543',
      correo: 'carlos.perez@hotmail.com',
      direccion: 'Carrera 24 # 64-12',
      esFacturaElectronica: false,
    },
    {
      id: 3,
      documento: '900123456-1',
      nombre: 'Aseguradora y Taller La 70 S.A.S.',
      telefono: '6013456789',
      correo: 'facturacion@tallerla70.com',
      direccion: 'Calle 72 # 20-40',
      esFacturaElectronica: true,
    },
  ];

  override buscarPorTermino(termino: string): Observable<Cliente[]> {
    if (!termino || termino.trim() === '') {
      return of([]).pipe(delay(100));
    }
    const q = termino.toLowerCase().trim();
    const filtrados = this.clientesEnMemoria.filter(
      (c) => c.documento.includes(q) || c.nombre.toLowerCase().includes(q),
    );
    return of(filtrados).pipe(delay(150));
  }

  override buscarPorDocumento(documento: string): Observable<Cliente | null> {
    const doc = documento.trim();
    const encontrado =
      this.clientesEnMemoria.find((c) => c.documento === doc) || null;
    return of(encontrado).pipe(delay(150));
  }

  override registrarCliente(
    request: CreateClienteRequest,
  ): Observable<Cliente> {
    const nuevo: Cliente = {
      id: Math.max(...this.clientesEnMemoria.map((c) => c.id), 0) + 1,
      documento: request.documento.trim(),
      nombre: request.nombre.trim(),
      telefono: request.telefono?.trim(),
      correo: request.correo?.trim(),
      direccion: request.direccion?.trim(),
      esFacturaElectronica: request.esFacturaElectronica ?? false,
    };

    this.clientesEnMemoria.unshift(nuevo);
    return of(nuevo).pipe(delay(200));
  }
}
