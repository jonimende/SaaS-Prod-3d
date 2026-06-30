import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService, FinancialSummary } from '../../services/finance.service';

@Component({
  selector: 'app-finanzas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './finanzas.html',
  styleUrl: './finanzas.scss'
})
export class Finanzas implements OnInit {
  private financeService = inject(FinanceService);

  // State signals
  summary = signal<FinancialSummary>({ totalRevenue: 0, totalCost: 0, netProfit: 0 });
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadFinancialSummary();
  }

  loadFinancialSummary(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.financeService.getFinancialSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Error al obtener el resumen financiero.');
      }
    });
  }
}
