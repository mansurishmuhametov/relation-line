/**
 * Координаты точки в интерфейсе (абсолютные значения)
 */
export class Point {
    constructor(
        private readonly x: number,
        private readonly y: number
    ) { }

    /**
     * Отступ от левого края в px
     */
    get X(): number {
        return this.x;
    }

    /**
     * Отступ от верхнего края в px
     */
    get Y(): number {
        return this.y;
    }
}
