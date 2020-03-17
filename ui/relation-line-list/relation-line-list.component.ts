import { Component, Input, ChangeDetectionStrategy, HostListener, Renderer2, OnChanges, ViewChild, ElementRef, OnInit, Inject, OnDestroy, AfterViewInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { timer, Subscription, Subject } from 'rxjs';
import * as _ from 'lodash';

import { IRelationLine } from '../../core/relation-line.interface';
import { Point } from '../../core/point';
import { REFRESH_DELAY } from '../../configuration/constants';

const SVG_STROKE_COLOR: string = '#dee2e6';

/**
 * Провести соединительную линию между 2 dom элементами
 */
@Component({
    selector: 'crumbs_relation-line-list-form',
    templateUrl: './relation-line-list.component.html',
    styleUrls: ['./relation-line-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RelationLineListComponent implements OnChanges, OnDestroy, AfterViewInit {
    private bound: HTMLElement;
    private boundingElementId: string;
    private destroy$: Subject<boolean> = new Subject<boolean>();
    private nameSpaceSvg: string;
    private refreshTimer: Subscription = new Subscription();
    private relationList: IRelationLine[];
    private unsubscribeList: (() => void)[];

    @ViewChild('relationLineList')
    private rootElement: ElementRef<HTMLDivElement>;

    constructor(
        @Inject(DOCUMENT)
        private readonly document: Document,
        private readonly renderer: Renderer2
    ) {
        this.relationList = [];
        this.unsubscribeList = [];
        this.nameSpaceSvg = 'svg';
    }

    @Input('RelationList')
    set RelationList(items: IRelationLine[]) {
        this.relationList = items;
    }

    get RelationList(): IRelationLine[] {
        return this.relationList;
    }

    /**
     * Ограничивает область видимости
     * Необходим для позиционирования через "position: absolute"
     * В элементе BoundingElement соответственно должен быть "position: relative"
     */
    @Input('BoundingElementId')
    set BoundingElementId(id: string) {
        this.boundingElementId = id;
    }

    /**
     * Инициализация шаблона
     */
    public ngAfterViewInit(): void {
        this.initBoundingElement(this.boundingElementId);
        this.initSubscribes();
    }

    /**
     * Срабатывает при изменение входных параметров
     */
    public ngOnChanges(): void {
        if (!this.bound) {
            return;
        }

        this.refreshLinks();
    }

    /**
     * Подписка на событие "scroll"
     * Перерисовать соединения при прокрутке
     */
    @HostListener('window:scroll', ['$event'])
    public scrollHandler(event: any): void {
        this.refreshLinks();
    }

    /**
     * Подписка на событие "resize"
     * Перерисовать соединения при изменение размера окна
     */
    @HostListener('window:resize', ['$event'])
    public onResize(event: any): void {
        this.refreshLinks();
    }

    /**
     * Отписка от событий
     */
    public ngOnDestroy(): void {
        _.forEach(this.unsubscribeList, (unsubscribe: () => void) => {
            unsubscribe();
        });
    }

    /**
     * Построить соединитльеную линию между всеми элементами
     */
    private refreshLinks(): void {
        this.clear();
        this.refreshTimer.unsubscribe();

        this.refreshTimer = timer(REFRESH_DELAY)
            .pipe(
                takeUntil(this.destroy$)
            )
            .subscribe(() => {
                this.linkAllEements();
            });
    }

    /**
     * Построить соединитльеную линию между всеми элементами
     */
    private linkAllEements(): void {
        if (!this.relationList || !this.relationList.length) {
            return;
        }

        _.forEach(this.relationList, (relation: IRelationLine, index: number) => {
            this.drawLine(relation);
        });
    }

    /**
     * Построить соединитльеную линию между двумя элементами
     * @param relation - 2 dom элемента
     */
    private drawLine(relation: IRelationLine): void {
        const startElement: HTMLElement = this.document.getElementById(relation.StartElementId);
        const endElement: HTMLElement = this.document.getElementById(relation.EndElementId);
        const isElementsInScope: boolean = this.validateElementsScope(startElement, endElement, this.bound);

        if (!isElementsInScope) {
            return;
        }

        const a: Point = this.getA(startElement);
        const b: Point = this.getB(endElement);
        const c: Point = this.getC(endElement);
        const d: Point = this.getD(startElement);

        const svg: HTMLElement = this.getSvg(a, b, c, d);
        const polygon: any = this.getPolygon(a, b, c, d, relation.Color);

        this.renderLine(this.rootElement, svg, polygon);
    }

    /**
     * Возвращает координаты точки A (фигура ABCD)
     * @param startElement - от которого элемента рисуется линия
     */
    private getA(startElement: HTMLElement): Point {
        const figure: DOMRect = startElement.getBoundingClientRect() as DOMRect;
        const x: number = figure.x + figure.width;
        const y: number = figure.y;

        return new Point(x, y);
    }

    /**
     * Возвращает координаты точки B (фигура ABCD)
     * @param endElement - до которого элемента рисуется линия
     */
    private getB(endElement: HTMLElement): Point {
        const figure: DOMRect = endElement.getBoundingClientRect() as DOMRect;
        const x: number = figure.x;
        const y: number = figure.y;

        return new Point(x, y);
    }

    /**
     * Возвращает координаты точки C (фигура ABCD)
     * @param endElement - до которого элемента рисуется линия
     */
    private getC(endElement: HTMLElement): Point {
        const figure: DOMRect = endElement.getBoundingClientRect() as DOMRect;
        const x: number = figure.x;
        const y: number = figure.y + figure.height;

        return new Point(x, y);
    }

    /**
     * Возвращает координаты точки D (фигура ABCD)
     * @param startElement - от которого элемента рисуется линия
     */
    private getD(startElement: HTMLElement): Point {
        const figure: DOMRect = startElement.getBoundingClientRect() as DOMRect;
        const x: number = figure.x + figure.width;
        const y: number = figure.y + figure.height;

        return new Point(x, y);
    }

    /**
     * Рисует линию
     * @param rootElement - корневой элемент в рамках которого все отрисовывается
     * @param svg - область, в которой рисуется линия
     * @param polygon - линия
     */
    private renderLine(rootElement: ElementRef<HTMLDivElement>, svg: HTMLElement, polygon: any): void {
        this.renderer.appendChild(rootElement.nativeElement, svg);
        this.renderer.appendChild(svg, polygon);
    }

    /**
     * Позволяет настроить svg, в рамках которой будет рисоваться линия
     * Область svg задается 4-мя точками ABCD
     * @param a - точка (фигуры ABCD)
     * @param b - точка (фигуры ABCD)
     * @param c - точка (фигуры ABCD)
     * @param d - точка (фигуры ABCD)
     */
    private getSvg(a: Point, b: Point, c: Point, d: Point): HTMLElement {
        const svg: HTMLElement = this.renderer.createElement('svg', this.nameSpaceSvg) as HTMLElement;

        const highest: Point = a.Y <= b.Y ? a : b;
        const lowest: Point = d.Y >= c.Y ? d : c;
        const left: Point = a;
        const right: Point = b;

        this.renderer.setStyle(svg, 'position', 'fixed');
        this.renderer.setStyle(svg, 'left', `${left.X}px`);
        this.renderer.setStyle(svg, 'top', `${highest.Y}px`);
        this.renderer.setStyle(svg, 'width', `${right.X - left.X}px`);
        this.renderer.setStyle(svg, 'height', `${lowest.Y - highest.Y}px`);

        return svg;
    }

    /**
     * Позволяет настроить polygon (линия, состоящая из 4х точек)
     * @param a - точка (фигуры ABCD)
     * @param b - точка (фигуры ABCD)
     * @param c - точка (фигуры ABCD)
     * @param d - точка (фигуры ABCD)
     * @param color - цвет линии
     */
    private getPolygon(a: Point, b: Point, c: Point, d: Point, color: string): HTMLElement {
        const polygon: any = this.renderer.createElement('polygon', this.nameSpaceSvg);

        polygon.style.fill = color;
        polygon.style.stroke = SVG_STROKE_COLOR;

        this.renderer.setAttribute(polygon, 'points', '0,0 0,0 0,0 0,0');

        const pointA: SVGPoint = polygon.points[0];
        const pointB: SVGPoint = polygon.points[1];
        const pointC: SVGPoint = polygon.points[2];
        const pointD: SVGPoint = polygon.points[3];

        const highest: Point = a.Y <= b.Y ? a : b;
        const lowest: Point = d.Y >= c.Y ? d : c;
        const svgHeight: number = lowest.Y - highest.Y;
        const svgWidth: number = b.X - a.X;
        const leftHeight: number = d.Y - a.Y;
        const rightHeight: number = c.Y - b.Y;

        pointA.x = 0;
        pointA.y = a.Y === highest.Y ? 0 : (svgHeight - leftHeight);

        pointB.x = svgWidth;
        pointB.y = b.Y === highest.Y ? 0 : (svgHeight - rightHeight);

        pointC.x = svgWidth;
        pointC.y = c.Y === lowest.Y ? svgHeight : rightHeight;

        pointD.x = 0;
        pointD.y = d.Y === lowest.Y ? svgHeight : leftHeight;

        return polygon;
    }

    /**
     * Удалить все линии
     */
    private clear(): void {
        _.forEach(this.rootElement.nativeElement.children, (item) => {
            this.renderer.removeChild(this.rootElement.nativeElement, item);
        });
    }

    /**
     * Находит родительский элемент, который ограничивает область видимости
     * @param id - ID элемента Bounding
     */
    private initBoundingElement(id: string): void {
        this.bound = this.document.getElementById(id);

        if (!this.bound) {
            throw new Error('BoundingElement could not be found');
        }
    }

    /**
     * Подписка на события
     * @param boundElement - родительский элемент, который ограничивает область видимости
     */
    private initSubscribes(): void {
        this.subscribeOnScrollEvent(this.bound);
    }

    /**
     * Подписка на событие прокрутки
     * @param scrollingElement - родительский элемент, который ограничивает область видимости
     */
    private subscribeOnScrollEvent(scrollingElement: HTMLElement): void {
        const scrollUnsubscribe: () => void = this.renderer.listen(scrollingElement, 'scroll', () => {
            this.refreshLinks();
        });

        this.unsubscribeList.push(scrollUnsubscribe);
    }

    /**
     * Проверяет выходят ли элементы за область видимости
     * @param startElement - от которого элемента рисуется линия
     * @param endElement - до которого элемента рисуется линия
     * @param boundElement - родительский элемент, который ограничивает область видимости
     */
    private validateElementsScope(startElement: HTMLElement, endElement: HTMLElement, boundElement: HTMLElement): boolean {
        if (!startElement || !endElement || !boundElement) {
            return false;
        }

        const start: DOMRect = startElement.getBoundingClientRect() as DOMRect;
        const end: DOMRect = endElement.getBoundingClientRect() as DOMRect;
        const bound: DOMRect = boundElement.getBoundingClientRect() as DOMRect;

        const minX: number = bound.x;
        const maxX: number = bound.x + bound.width;
        const minY: number = bound.y;
        const maxY: number = bound.y + bound.height;

        const startX: number = start.x + start.width;
        const endX: number = end.x;

        if (startX < minX || startX > maxX) {
            return false;
        }

        if (endX < minX || endX > maxX) {
            return false;
        }

        const startMinY: number = start.y;
        const startMaxY: number = start.y + start.height;
        const endMinY: number = end.y;
        const endMaxY: number = end.y + end.height;

        if ((startMinY < minY) || (endMinY < minY)) {
            return false;
        }

        if ((startMaxY > maxY) || (endMaxY > maxY)) {
            return false;
        }

        return true;
    }
}
