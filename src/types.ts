// ─────────────────────────────────────────────────────────────────────────────
// TIPOS Y MODELOS DE DATOS — Monthly Budget Tracker
// ─────────────────────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'salary'       // Salario / nómina
  | 'freelance'    // Trabajo independiente
  | 'investment'   // Inversiones / rendimientos
  | 'other_income' // Otros ingresos
  | 'housing'      // Vivienda (arriendo, servicios)
  | 'food'         // Alimentación
  | 'transport'    // Transporte
  | 'health'       // Salud / medicina
  | 'education'    // Educación
  | 'entertainment'// Entretenimiento / ocio
  | 'savings'      // Ahorro programado
  | 'debt'         // Pago de deudas
  | 'other_expense';// Otros gastos

export interface Transaction {
  id: string;
  date: string;           // ISO 8601: "2025-04-15"
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  amount: number;         // Siempre positivo
  tags: string[];
  note?: string;
}

export interface MonthlyBudget {
  budgetedIncome: number;    // Presupuesto de ingresos esperado
  budgetedExpenses: number;  // Presupuesto de gastos permitido
}

export interface MonthRecord {
  year: number;
  month: number;              // 1-12
  transactions: Transaction[];
  budget: MonthlyBudget;
  carryOver: number;          // Saldo arrastrado desde mes anterior (puede ser negativo)
  closedAt?: string;          // ISO timestamp del cierre
  isClosed: boolean;
  closingNote?: string;
}

export interface ClosingSummary {
  year: number;
  month: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;         // income - expenses
  carryOverIn: number;        // saldo que llegó del mes anterior
  finalBalance: number;       // netBalance + carryOverIn → pasa al siguiente mes
  closedAt: string;
  closingNote?: string;
}

export interface PluginSettings {
  currency: string;            // Símbolo de moneda, ej: "$", "€", "COP"
  currencyCode: string;        // Código ISO, ej: "COP", "USD"
  outputFolder: string;        // Carpeta del vault para exportar cierres
  autoExportMarkdown: boolean; // Exportar Markdown automáticamente al cerrar
  defaultBudgetIncome: number;
  defaultBudgetExpenses: number;
  showCarryOverWarning: boolean;
  decimalSeparator: ',' | '.';
  firstDayOfMonth: number;     // Generalmente 1
}

export interface PluginData {
  settings: PluginSettings;
  months: Record<string, MonthRecord>; // key: "YYYY-MM"
  closingHistory: ClosingSummary[];
  meta: {
    version: string;
    lastSaved: string;
    currentPeriod: string; // "YYYY-MM"
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE FECHA
// ─────────────────────────────────────────────────────────────────────────────

export function periodKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function currentPeriodKey(): string {
  const now = new Date();
  return periodKey(now.getFullYear(), now.getMonth() + 1);
}

export function nextPeriodKey(year: number, month: number): string {
  if (month === 12) return periodKey(year + 1, 1);
  return periodKey(year, month + 1);
}

export function previousPeriodKey(year: number, month: number): string {
  if (month === 1) return periodKey(year - 1, 12);
  return periodKey(year, month - 1);
}

export function monthName(month: number, locale = 'es-CO'): string {
  return new Date(2024, month - 1, 1).toLocaleString(locale, { month: 'long' });
}

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  salary: 'Salario',
  freelance: 'Freelance',
  investment: 'Inversión',
  other_income: 'Otros ingresos',
  housing: 'Vivienda',
  food: 'Alimentación',
  transport: 'Transporte',
  health: 'Salud',
  education: 'Educación',
  entertainment: 'Entretenimiento',
  savings: 'Ahorro',
  debt: 'Deudas',
  other_expense: 'Otros gastos',
};

export const INCOME_CATEGORIES: TransactionCategory[] = [
  'salary', 'freelance', 'investment', 'other_income',
];

export const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'housing', 'food', 'transport', 'health',
  'education', 'entertainment', 'savings', 'debt', 'other_expense',
];

export const DEFAULT_SETTINGS: PluginSettings = {
  currency: '$',
  currencyCode: 'COP',
  outputFolder: 'Budget/cierres',
  autoExportMarkdown: true,
  defaultBudgetIncome: 0,
  defaultBudgetExpenses: 0,
  showCarryOverWarning: true,
  decimalSeparator: ',',
  firstDayOfMonth: 1,
};
