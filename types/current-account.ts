export type TipoMovimiento = 'abono' | 'cargo';

export interface CurrentAccountMovement {
    id?: number;
    empresa_id: number;
    fecha_movimiento?: Date | string;
    tipo_movimiento: TipoMovimiento;
    monto: number;
    descripcion?: string;
    saldo: number;
    referencia?: string;
    pagado?: boolean;
    tipo_pago?: string;
    mes_operacion?: string;
    periodo_operacion?: string;
    empresa?: {
        id: string | number;
        nombre: string;
        ente_facturador?: string;
    };
}

export interface CreateMovementRequest {
    empresa_id: number;
    tipo_movimiento: TipoMovimiento;
    monto: number;
    descripcion?: string;
    referencia?: string;
    tipo_pago?: string;
}