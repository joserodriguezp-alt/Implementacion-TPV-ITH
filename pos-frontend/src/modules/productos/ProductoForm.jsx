import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { crearProducto, actualizarProducto } from '../../api/productos.api.js';
import { notifySuccess, notifyError, notifyWarning } from '../../utils/notify.js';
import { Button } from '../../components/ui/Button.jsx';
import { Input }  from '../../components/ui/Input.jsx';

const schema = z.object({
  nombre:        z.string().min(1, 'El nombre es requerido'),
  codigo_barras: z.string().min(1, 'El código de barras es requerido'),
  precio_compra: z.coerce.number().min(0, 'Debe ser mayor o igual a 0'),
  precio_venta:  z.coerce.number().positive('Debe ser mayor a 0'),
  stock_actual:  z.coerce.number().int().min(0, 'Debe ser 0 o más'),
  stock_minimo:  z.coerce.number().int().min(0, 'Debe ser 0 o más'),
  descripcion:   z.string().optional(),
});

// Funciona en modo creación (producto=null) y edición (TASK-F013)
export function ProductoForm({ producto = null, onGuardado }) {
  const [cargando,   setCargando]   = useState(false);
  const [advertencia, setAdvertencia] = useState(false);
  const esEdicion = !!producto;

  const { register, handleSubmit, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: producto ? {
      nombre:        producto.nombre,
      codigo_barras: producto.codigo_barras,
      precio_compra: producto.precio_compra,
      precio_venta:  producto.precio_venta,
      stock_actual:  producto.stock_actual,
      stock_minimo:  producto.stock_minimo,
      descripcion:   producto.descripcion ?? '',
    } : { stock_actual: 0, stock_minimo: 5 },
  });

  async function guardar(datos) {
    // Advertencia si precio de venta < precio de compra (TASK-F013)
    if (Number(datos.precio_venta) < Number(datos.precio_compra) && !advertencia) {
      notifyWarning('El precio de venta es menor al costo. Confirma para continuar.');
      setAdvertencia(true);
      return;
    }
    setCargando(true);
    try {
      if (esEdicion) {
        await actualizarProducto(producto.id_producto, datos);
        notifySuccess('Producto actualizado');
      } else {
        await crearProducto(datos);
        notifySuccess('Producto creado');
      }
      onGuardado();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setCargando(false);
      setAdvertencia(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(guardar)} className="flex flex-col gap-4" noValidate>
      <Input label="Nombre" id="nombre" error={errors.nombre?.message} {...register('nombre')} />
      <Input label="Código de barras" id="codigo_barras" error={errors.codigo_barras?.message} {...register('codigo_barras')} />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Precio compra ($)" id="precio_compra" type="number" step="0.01" error={errors.precio_compra?.message} {...register('precio_compra')} />
        <Input label="Precio venta ($)"  id="precio_venta"  type="number" step="0.01" error={errors.precio_venta?.message}  {...register('precio_venta')} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Stock inicial" id="stock_actual" type="number" error={errors.stock_actual?.message} {...register('stock_actual')} />
        <Input label="Stock mínimo"  id="stock_minimo" type="number" error={errors.stock_minimo?.message} {...register('stock_minimo')} />
      </div>

      <Input label="Descripción (opcional)" id="descripcion" {...register('descripcion')} />

      {advertencia && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded p-3">
          ⚠️ El precio de venta es menor al costo. Haz clic en "Guardar" nuevamente para confirmar.
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" cargando={cargando}>
          {cargando ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}
