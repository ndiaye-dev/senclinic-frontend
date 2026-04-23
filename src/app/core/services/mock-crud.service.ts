import { signal, type WritableSignal } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';

export abstract class MockCrudService<T extends { id: number }> {
  private readonly latency = 250;
  protected readonly itemsSignal: WritableSignal<T[]>;

  protected constructor(
    initialData: T[],
    private readonly entityLabel: string
  ) {
    this.itemsSignal = signal(this.clone(initialData));
  }

  list(): Observable<T[]> {
    return of(this.clone(this.itemsSignal())).pipe(delay(this.latency));
  }

  create(payload: Omit<T, 'id'>): Observable<T> {
    const createdItem = { ...payload, id: this.nextId() } as T;
    this.itemsSignal.update((current) => [createdItem, ...current]);

    return of(this.clone(createdItem)).pipe(delay(this.latency));
  }

  update(id: number, payload: Omit<T, 'id'>): Observable<T> {
    const items = this.itemsSignal();
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      return throwError(() => new Error(`${this.entityLabel} introuvable.`));
    }

    const updatedItem = { ...payload, id } as T;
    const updatedItems = [...items];
    updatedItems[index] = updatedItem;
    this.itemsSignal.set(updatedItems);

    return of(this.clone(updatedItem)).pipe(delay(this.latency));
  }

  delete(id: number): Observable<void> {
    const items = this.itemsSignal();
    const existing = items.some((item) => item.id === id);

    if (!existing) {
      return throwError(() => new Error(`${this.entityLabel} introuvable.`));
    }

    this.itemsSignal.set(items.filter((item) => item.id !== id));
    return of(void 0).pipe(delay(this.latency));
  }

  protected getSnapshot(): T[] {
    return this.clone(this.itemsSignal());
  }

  private nextId(): number {
    const ids = this.itemsSignal().map((item) => item.id);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  private clone<K>(value: K): K {
    return JSON.parse(JSON.stringify(value)) as K;
  }
}
