import { EventEmitter } from "@angular/core";

export interface InlineComponent {
    // properties
    item: number;
    changeItemEvt: EventEmitter<number>;
    selectedElement: number;

    // methods
    deleteItem(id: string): void;
    change(event: number): void;
    openCreateModal(): void;
    openEditModal(): void;
    openDeleteModal(): void;
}