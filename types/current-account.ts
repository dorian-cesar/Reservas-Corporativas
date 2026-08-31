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
    mes_operacion?: string;
    periodo_operacion?: string;
}

export interface CreateMovementRequest {
    empresa_id: number;
    tipo_movimiento: TipoMovimiento;
    monto: number;
    descripcion?: string;
    referencia?: string;
}