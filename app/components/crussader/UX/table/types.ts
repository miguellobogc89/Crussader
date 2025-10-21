export type SortDir = "asc" | "desc";
export type Align = "left" | "center" | "right";
export type FilterKind = "none" | "text" | "boolean";

export interface ColumnDef<T> {
  /** identificador único de la columna */
  id: string;
  /** etiqueta visible de cabecera */
  label: string;
  /** ancho como % (opcional). Si no se pasa, reparte automático */
  widthPerc?: number;
  /** alineación: por defecto 'left' */
  align?: Align;
  /** si permite ordenar */
  sortable?: boolean;
  /** tipo de filtro a mostrar en el icono de filtro */
  filter?: FilterKind;
  /** valor base para ordenar y filtrar */
  accessor: (row: T) => unknown;
  /** render opcional si quieres personalizar la celda */
  render?: (row: T) => React.ReactNode;
}
