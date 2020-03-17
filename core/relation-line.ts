import { IRelationLine } from './relation-line.interface';

/**
 * Цветная линия, которая соединяет два DOM элемента
 */
export class RelationLine implements IRelationLine {
    constructor(
        private readonly startElementId: string,
        private readonly endElementId: string,
        private readonly color?: string
    ) { }

    get StartElementId(): string {
        return this.startElementId;
    }

    get EndElementId(): string {
        return this.endElementId;
    }

    get Color(): string {
        return this.color;
    }
}
