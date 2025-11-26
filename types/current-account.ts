export type TipoMovimiento = 'abono' | 'cargo';

export interface CurrentAccountMovement {
    id?: number;
    empresa_id: number;
    fecha_movimiento?: Date;
    tipo_movimiento: TipoMovimiento;
    monto: number;
    descripcion?: string;
    saldo: number;
    referencia?: string;
}

export interface CreateMovementRequest {
    empresa_id: number;
    tipo_movimiento: TipoMovimiento;
    monto: number;
    descripcion?: string;
    referencia?: string;
}