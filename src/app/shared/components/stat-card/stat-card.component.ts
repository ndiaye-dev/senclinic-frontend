import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss'
})
export class StatCardComponent {
  readonly title = input.required<string>();
  readonly value = input.required<string>();
  readonly description = input<string>('');
  readonly chip = input<string>('');
  readonly trend = input<string>('');
  readonly progress = input<number | null>(null);
  readonly tone = input<'teal' | 'blue' | 'gray'>('gray');

  readonly progressValue = computed(() => {
    const value = this.progress();
    if (value === null || Number.isNaN(value)) {
      return null;
    }

    return Math.max(0, Math.min(100, Math.round(value)));
  });
}
