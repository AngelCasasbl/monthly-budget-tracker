// ─────────────────────────────────────────────────────────────────────────────
// LÓGICA DE NEGOCIO — Operaciones de presupuesto mensual
// ─────────────────────────────────────────────────────────────────────────────

import {
  Transaction,
  TransactionType,
  TransactionCategory,
  MonthRecord,
  MonthlyBudget,
  ClosingSummary,
  PluginData,
  PluginSettings,
  DEFAULT_SETTINGS,
  periodKey,
  currentPeriodKey,
  nextPeriodKey,
  INCOME_CATEGORIES,
  monthName,
} from './types';

export class BudgetManager {
  private data: PluginData;

  constructor(data: PluginData) {
    this.data = data;
  }

  getData(): PluginData {
    return this.data;
  }

  // ─── Período actual ───────────────────────────────────────────────────────

  getCurrentPeriod(): MonthRecord {
    const key = currentPeriodKey();
    if (!this.data.months[key]) {
      this.data.months[key] = this.createEmptyMonth(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0
      );
      this.data.meta.currentPeriod = key;
    }
    return this.data.months[key];
  }

  getPeriod(key: string): MonthRecord | null {
    return this.data.months[key] ?? null;
  }

  getAllPeriodKeys(): string[] {
    return Object.keys(this.data.months).sort();
  }

  // ─── Transacciones ────────────────────────────────────────────────────────

  addTransaction(
    periodKey: string,
    type: TransactionType,
    category: TransactionCategory,
    description: string,
    amount: number,
    date?: string,
    note?: string,
    tags?: string[]
  ): Transaction {
    const month = this.data.months[periodKey];
    if (!month) throw new Error(`Período ${periodKey} no existe.`);
    if (month.isClosed) throw new Error(`El período ${periodKey} ya está cerrado.`);

    const tx: Transaction = {
      id: this.generateId(),
      date: date ?? new Date().toISOString().split('T')[0],
      type,
      category,
      description,
      amount: Math.abs(amount),
      tags: tags ?? [],
      note,
    };

    month.transactions.push(tx);
    return tx;
  }

  updateTransaction(
    periodKey: string,
    id: string,
    updates: Partial<Omit<Transaction, 'id'>>
  ): boolean {
    const month = this.data.months[periodKey];
    if (!month || month.isClosed) return false;
    const idx = month.transactions.findIndex(t => t.id === id);
    if (idx === -1) return false;
    month.transactions[idx] = { ...month.transactions[idx], ...updates };
    return true;
  }

  deleteTransaction(periodKey: string, id: string): boolean {
    const month = this.data.months[periodKey];
    if (!month || month.isClosed) return false;
    const before = month.transactions.length;
    month.transactions = month.transactions.filter(t => t.id !== id);
    return month.transactions.length < before;
  }

  // ─── Cálculos ─────────────────────────────────────────────────────────────

  calcTotalIncome(month: MonthRecord): number {
    return month.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  calcTotalExpenses(month: MonthRecord): number {
    return month.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  calcNetBalance(month: MonthRecord): number {
    return this.calcTotalIncome(month) - this.calcTotalExpenses(month);
  }

  calcFinalBalance(month: MonthRecord): number {
    return this.calcNetBalance(month) + month.carryOver;
  }

  calcByCategory(month: MonthRecord): Record<string, number> {
    const result: Record<string, number> = {};
    for (const tx of month.transactions) {
      result[tx.category] = (result[tx.category] ?? 0) + tx.amount;
    }
    return result;
  }

  getBudgetProgress(month: MonthRecord): {
    incomeProgress: number;
    expenseProgress: number;
    isOverBudget: boolean;
  } {
    const income = this.calcTotalIncome(month);
    const expenses = this.calcTotalExpenses(month);
    return {
      incomeProgress: month.budget.budgetedIncome > 0
        ? (income / month.budget.budgetedIncome) * 100
        : 0,
      expenseProgress: month.budget.budgetedExpenses > 0
        ? (expenses / month.budget.budgetedExpenses) * 100
        : 0,
      isOverBudget: month.budget.budgetedExpenses > 0
        && expenses > month.budget.budgetedExpenses,
    };
  }

  // ─── Cierre mensual ───────────────────────────────────────────────────────

  closeMonth(key: string, closingNote?: string): ClosingSummary {
    const month = this.data.months[key];
    if (!month) throw new Error(`Período ${key} no existe.`);
    if (month.isClosed) throw new Error(`El período ${key} ya fue cerrado.`);

    const totalIncome = this.calcTotalIncome(month);
    const totalExpenses = this.calcTotalExpenses(month);
    const netBalance = totalIncome - totalExpenses;
    const finalBalance = netBalance + month.carryOver;

    const closedAt = new Date().toISOString();

    // Marcar como cerrado
    month.isClosed = true;
    month.closedAt = closedAt;
    month.closingNote = closingNote;

    // Crear resumen de cierre
    const summary: ClosingSummary = {
      year: month.year,
      month: month.month,
      totalIncome,
      totalExpenses,
      netBalance,
      carryOverIn: month.carryOver,
      finalBalance,
      closedAt,
      closingNote,
    };

    this.data.closingHistory.push(summary);

    // Crear el mes siguiente con el saldo arrastrado
    const nextKey = nextPeriodKey(month.year, month.month);
    if (!this.data.months[nextKey]) {
      const [nextYear, nextMonth] = nextKey.split('-').map(Number);
      this.data.months[nextKey] = this.createEmptyMonth(
        nextYear,
        nextMonth,
        finalBalance
      );
    } else {
      // Si el mes ya existía, actualizar su carryOver
      this.data.months[nextKey].carryOver = finalBalance;
    }

    this.data.meta.currentPeriod = nextKey;

    return summary;
  }

  reopenMonth(key: string): boolean {
    const month = this.data.months[key];
    if (!month || !month.isClosed) return false;

    // Verificar que no hay meses posteriores cerrados que dependan de este
    const keys = this.getAllPeriodKeys();
    const idx = keys.indexOf(key);
    for (let i = idx + 1; i < keys.length; i++) {
      if (this.data.months[keys[i]].isClosed) {
        throw new Error(
          `No se puede reabrir: el período ${keys[i]} ya fue cerrado y depende de este.`
        );
      }
    }

    month.isClosed = false;
    month.closedAt = undefined;

    // Remover de historial
    this.data.closingHistory = this.data.closingHistory.filter(
      s => !(s.year === month.year && s.month === month.month)
    );

    return true;
  }

  updateBudget(key: string, budget: Partial<MonthlyBudget>): void {
    const month = this.data.months[key];
    if (!month || month.isClosed) return;
    month.budget = { ...month.budget, ...budget };
  }

  // ─── Exportación Markdown ─────────────────────────────────────────────────

  generateMarkdownReport(key: string, settings: PluginSettings): string {
    const month = this.data.months[key];
    if (!month) return '';

    const fmt = (n: number) =>
      `${settings.currency}${n.toLocaleString('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`;

    const totalIncome = this.calcTotalIncome(month);
    const totalExpenses = this.calcTotalExpenses(month);
    const netBalance = totalIncome - totalExpenses;
    const finalBalance = netBalance + month.carryOver;
    const byCategory = this.calcByCategory(month);

    const title = `${monthName(month.month)} ${month.year}`;
    const status = month.isClosed ? '✅ Cerrado' : '🔄 En curso';

    let md = `# Presupuesto — ${title}\n\n`;
    md += `> Estado: **${status}**${month.closedAt ? `  |  Cerrado: ${new Date(month.closedAt).toLocaleDateString('es-CO')}` : ''}\n\n`;
    md += `---\n\n`;

    md += `## Resumen\n\n`;
    md += `| Concepto | Monto |\n|---|---|\n`;
    md += `| 💰 Saldo arrastrado (mes anterior) | **${fmt(month.carryOver)}** |\n`;
    md += `| ➕ Total ingresos | **${fmt(totalIncome)}** |\n`;
    md += `| ➖ Total gastos | **${fmt(totalExpenses)}** |\n`;
    md += `| 📊 Balance neto del mes | **${fmt(netBalance)}** |\n`;
    md += `| 🏦 Saldo final (pasa al siguiente mes) | **${fmt(finalBalance)}** |\n\n`;

    if (month.budget.budgetedIncome > 0 || month.budget.budgetedExpenses > 0) {
      md += `## Presupuesto vs Real\n\n`;
      md += `| Categoría | Presupuestado | Real | Diferencia |\n|---|---|---|---|\n`;
      if (month.budget.budgetedIncome > 0) {
        const diff = totalIncome - month.budget.budgetedIncome;
        md += `| Ingresos | ${fmt(month.budget.budgetedIncome)} | ${fmt(totalIncome)} | ${diff >= 0 ? '+' : ''}${fmt(diff)} |\n`;
      }
      if (month.budget.budgetedExpenses > 0) {
        const diff = month.budget.budgetedExpenses - totalExpenses;
        md += `| Gastos | ${fmt(month.budget.budgetedExpenses)} | ${fmt(totalExpenses)} | ${diff >= 0 ? '+' : ''}${fmt(diff)} |\n`;
      }
      md += `\n`;
    }

    md += `## Ingresos\n\n`;
    const incomes = month.transactions.filter(t => t.type === 'income');
    if (incomes.length === 0) {
      md += `_Sin ingresos registrados._\n\n`;
    } else {
      md += `| Fecha | Categoría | Descripción | Monto |\n|---|---|---|---|\n`;
      for (const tx of incomes) {
        md += `| ${tx.date} | ${tx.category} | ${tx.description} | ${fmt(tx.amount)} |\n`;
      }
      md += `\n`;
    }

    md += `## Gastos\n\n`;
    const expenses = month.transactions.filter(t => t.type === 'expense');
    if (expenses.length === 0) {
      md += `_Sin gastos registrados._\n\n`;
    } else {
      md += `| Fecha | Categoría | Descripción | Monto |\n|---|---|---|---|\n`;
      for (const tx of expenses) {
        md += `| ${tx.date} | ${tx.category} | ${tx.description} | ${fmt(tx.amount)} |\n`;
      }
      md += `\n`;
    }

    md += `## Por categoría\n\n`;
    md += `| Categoría | Total |\n|---|---|\n`;
    for (const [cat, total] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
      const isIncome = INCOME_CATEGORIES.includes(cat as any);
      md += `| ${isIncome ? '➕' : '➖'} ${cat} | ${fmt(total)} |\n`;
    }
    md += `\n`;

    if (month.closingNote) {
      md += `## Nota de cierre\n\n${month.closingNote}\n\n`;
    }

    md += `---\n_Generado por Monthly Budget Tracker · ${new Date().toLocaleDateString('es-CO')}_\n`;

    return md;
  }

  // ─── Historial ────────────────────────────────────────────────────────────

  getClosingHistory(): ClosingSummary[] {
    return [...this.data.closingHistory].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }

  getAnnualSummary(year: number): {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    months: ClosingSummary[];
  } {
    const months = this.data.closingHistory.filter(s => s.year === year);
    return {
      totalIncome: months.reduce((s, m) => s + m.totalIncome, 0),
      totalExpenses: months.reduce((s, m) => s + m.totalExpenses, 0),
      netBalance: months.reduce((s, m) => s + m.netBalance, 0),
      months,
    };
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────

  private createEmptyMonth(
    year: number,
    month: number,
    carryOver: number
  ): MonthRecord {
    return {
      year,
      month,
      transactions: [],
      budget: {
        budgetedIncome: this.data.settings.defaultBudgetIncome,
        budgetedExpenses: this.data.settings.defaultBudgetExpenses,
      },
      carryOver,
      isClosed: false,
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  // ─── Inicialización de datos vacíos ──────────────────────────────────────

  static createEmptyData(pluginVersion: string): PluginData {
    const key = currentPeriodKey();
    const now = new Date();
    return {
      settings: { ...DEFAULT_SETTINGS },
      months: {
        [key]: {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          transactions: [],
          budget: {
            budgetedIncome: DEFAULT_SETTINGS.defaultBudgetIncome,
            budgetedExpenses: DEFAULT_SETTINGS.defaultBudgetExpenses,
          },
          carryOver: 0,
          isClosed: false,
        },
      },
      closingHistory: [],
      meta: {
        version: pluginVersion,
        lastSaved: new Date().toISOString(),
        currentPeriod: key,
      },
    };
  }
}
