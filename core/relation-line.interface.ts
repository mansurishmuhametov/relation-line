/**
 * Связь между двумя элемента
 */
export interface IRelationLine {
    /**
     * Id dom элемента, начало связи
     */
    readonly StartElementId: string;
    /**
     * Id dom элемента, окончание связи
     */
    readonly EndElementId: string;
    /**
     * Цвет линии, связывающей два элемента
     */
    readonly Color: string;
}