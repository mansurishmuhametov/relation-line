import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RelationLineListComponent } from '../ui/relation-line-list/relation-line-list.component';

/**
 * Содержит только один компонент RelationLineListComponent
 */
@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        RelationLineListComponent
    ],
    exports: [
        RelationLineListComponent
    ]
})
export class RelationLineModule { }
