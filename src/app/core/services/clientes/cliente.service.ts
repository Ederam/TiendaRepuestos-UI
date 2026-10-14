/**
 * @fileoverview Puerto abstracto para la administración y búsqueda de clientes.
 */

import { Observable } from 'rxjs';
import { Cliente, CreateClienteRequest } from '../../models/cliente.models';

export abstract class ClienteService {
  abstract buscarPorTermino(termino: string): Observable<Cliente[]>;
  abstract buscarPorDocumento(documento: string): Observable<Cliente | null>;
  abstract registrarCliente(request: CreateClienteRequest): Observable<Cliente>;
}
