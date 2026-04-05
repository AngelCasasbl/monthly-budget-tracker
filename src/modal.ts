import { App, Modal, Notice, Setting } from 'obsidian';
import {
	TransactionType, TransactionCategory,
	CATEGORY_LABELS, INCOME_CATEGORIES, EXPENSE_CATEGORIES,
	monthName, periodKey,
} from './types';
import { BudgetManager } from './budget-manager';
import type MonthlyBudgetPlugin from './main';

type TabId = 'dashboard' | 'transactions' | 'add' | 'close' | 'history';

export class BudgetModal extends Modal {
	private plugin: MonthlyBudgetPlugin;
	private manager: BudgetManager;
	private activeTab: TabId = 'dashboard';
	private selectedPeriod: string;
	private addType: TransactionType = 'expense';

	constructor(app: App, plugin: MonthlyBudgetPlugin) {
		super(app);
		this.plugin = plugin;
		this.manager = plugin.manager;
		const cur = plugin.manager.getCurrentPeriod();
		this.selectedPeriod = periodKey(cur.year, cur.month);
	}

	onOpen() {
		this.modalEl.addClass('budget-modal');
		this.render();
	}

	onClose() {
		this.contentEl.empty();
	}

	private render() {
		const { contentEl } = this;
		contentEl.empty();

		// Header
		const header = contentEl.createDiv('budget-header');
		const month = this.manager.getPeriod(this.selectedPeriod);
		const title = month
			? `${monthName(month.month)} ${month.year}${month.isClosed ? ' ✅' : ''}`
			: 'Budget Tracker';
		header.createEl('h2', { text: title, cls: 'budget-title' });

		// Selector de periodo
		const periods = this.manager.getAllPeriodKeys();
		if (periods.length > 1) {
			const sel = header.createEl('select', { cls: 'budget-period-select' });
			for (const p of [...periods].reverse()) {
				const [y, mo] = p.split('-').map(Number);
				const opt = sel.createEl('option', { text: `${monthName(mo)} ${y}`, value: p });
				if (p === this.selectedPeriod) opt.selected = true;
			}
			sel.addEventListener('change', () => { this.selectedPeriod = sel.value; this.render(); });
		}

		// Tabs
		const nav = contentEl.createDiv('budget-nav');
		const tabs: { id: TabId; label: string }[] = [
			{ id: 'dashboard', label: '📊 Resumen' },
			{ id: 'transactions', label: '📋 Movimientos' },
			{ id: 'add', label: '➕ Agregar' },
			{ id: 'close', label: '🔒 Cerrar mes' },
			{ id: 'history', label: '📅 Historial' },
		];
		for (const tab of tabs) {
			const btn = nav.createEl('button', {
				text: tab.label,
				cls: `budget-tab${this.activeTab === tab.id ? ' active' : ''}`,
			});
			btn.addEventListener('click', () => { this.activeTab = tab.id; this.render(); });
		}

		const body = contentEl.createDiv('budget-body');
		if (this.activeTab === 'dashboard') this.renderDashboard(body);
		else if (this.activeTab === 'transactions') this.renderTransactions(body);
		else if (this.activeTab === 'add') this.renderAdd(body);
		else if (this.activeTab === 'close') this.renderClose(body);
		else if (this.activeTab === 'history') this.renderHistory(body);
	}

	// ─── Dashboard ────────────────────────────────────────────────────────────

	private renderDashboard(container: HTMLElement) {
		const month = this.manager.getPeriod(this.selectedPeriod);
		if (!month) { container.createEl('p', { text: 'Sin datos para este periodo.' }); return; }

		const totalIncome = this.manager.calcTotalIncome(month);
		const totalExpenses = this.manager.calcTotalExpenses(month);
		const netBalance = totalIncome - totalExpenses;
		const finalBalance = netBalance + month.carryOver;
		const progress = this.manager.getBudgetProgress(month);

		const cards = container.createDiv('budget-cards');
		this.createCard(cards, '💰 Arrastre anterior', this.fmt(month.carryOver), month.carryOver >= 0 ? 'positive' : 'negative');
		this.createCard(cards, '➕ Ingresos', this.fmt(totalIncome), 'positive');
		this.createCard(cards, '➖ Gastos', this.fmt(totalExpenses), 'negative');
		this.createCard(cards, '📊 Balance neto', this.fmt(netBalance), netBalance >= 0 ? 'positive' : 'negative');
		this.createCard(cards, '🏦 Saldo final', this.fmt(finalBalance), finalBalance >= 0 ? 'positive' : 'negative', true);

		if (finalBalance < 0) {
			const alert = container.createDiv('budget-alert budget-alert-danger');
			alert.createEl('strong', { text: 'Atencion: ' });
			alert.appendText(`Saldo negativo (${this.fmt(finalBalance)}). Se arrastrara al siguiente mes.`);
		} else if (finalBalance > 0 && month.isClosed) {
			const alert = container.createDiv('budget-alert budget-alert-success');
			alert.createEl('strong', { text: 'Cierre exitoso: ' });
			alert.appendText(`${this.fmt(finalBalance)} pasan al siguiente mes.`);
		}

		if (month.budget.budgetedExpenses > 0) {
			container.createEl('h3', { text: 'Progreso de gastos' });
			const barWrap = container.createDiv('budget-bar-wrap');
			barWrap.createEl('span', { text: `${Math.round(progress.expenseProgress)}%`, cls: 'budget-bar-label' });
			const track = barWrap.createDiv('budget-bar-track');
			const fill = track.createDiv(`budget-bar-fill${progress.isOverBudget ? ' over' : ''}`);
			fill.style.width = `${Math.min(progress.expenseProgress, 100)}%`;
			barWrap.createEl('span', {
				text: `${this.fmt(totalExpenses)} / ${this.fmt(month.budget.budgetedExpenses)}`,
				cls: 'budget-bar-amounts',
			});
		}

		const byCategory = this.manager.calcByCategory(month);
		if (Object.keys(byCategory).length > 0) {
			container.createEl('h3', { text: 'Por categoria' });
			const catList = container.createDiv('budget-categories');
			for (const [cat, total] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
				const isIncome = INCOME_CATEGORIES.includes(cat as TransactionCategory);
				const row = catList.createDiv('budget-cat-row');
				row.createEl('span', { text: `${isIncome ? '➕' : '➖'} ${CATEGORY_LABELS[cat as TransactionCategory] ?? cat}`, cls: 'budget-cat-name' });
				row.createEl('span', { text: this.fmt(total), cls: `budget-cat-amount ${isIncome ? 'positive' : 'negative'}` });
			}
		}
	}

	// ─── Transacciones ────────────────────────────────────────────────────────

	private renderTransactions(container: HTMLElement) {
		const month = this.manager.getPeriod(this.selectedPeriod);
		if (!month) return;
		const txs = [...month.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

		if (txs.length === 0) {
			container.createEl('p', { text: 'Sin transacciones en este periodo.', cls: 'budget-empty' });
			return;
		}

		const filterRow = container.createDiv('budget-filter-row');
		filterRow.createEl('span', { text: `${txs.length} movimientos` });
		if (!month.isClosed) {
			const addBtn = filterRow.createEl('button', { text: '➕ Agregar', cls: 'budget-btn-sm' });
			addBtn.addEventListener('click', () => { this.activeTab = 'add'; this.render(); });
		}

		const table = container.createEl('table', { cls: 'budget-table' });
		const tr0 = table.createEl('thead').createEl('tr');
		['Fecha', 'Tipo', 'Categoria', 'Descripcion', 'Monto', ''].forEach(h => tr0.createEl('th', { text: h }));
		const tbody = table.createEl('tbody');

		for (const tx of txs) {
			const tr = tbody.createEl('tr', { cls: tx.type === 'income' ? 'income-row' : 'expense-row' });
			tr.createEl('td', { text: tx.date });
			tr.createEl('td', { text: tx.type === 'income' ? '➕' : '➖' });
			tr.createEl('td', { text: CATEGORY_LABELS[tx.category] ?? tx.category });
			const dtd = tr.createEl('td', { text: tx.description });
			if (tx.note) dtd.title = tx.note;
			tr.createEl('td', { text: this.fmt(tx.amount), cls: `amount-cell ${tx.type === 'income' ? 'positive' : 'negative'}` });
			const atd = tr.createEl('td');
			if (!month.isClosed) {
				const del = atd.createEl('button', { text: '🗑', cls: 'budget-del-btn' });
				del.addEventListener('click', async () => {
					if (confirm(`Eliminar "${tx.description}"?`)) {
						this.manager.deleteTransaction(this.selectedPeriod, tx.id);
						await this.plugin.saveData();
						new Notice('Eliminado.');
						this.render();
					}
				});
			}
		}
	}

	// ─── Agregar ──────────────────────────────────────────────────────────────

	private renderAdd(container: HTMLElement) {
		const month = this.manager.getPeriod(this.selectedPeriod);
		if (!month) return;

		if (month.isClosed) {
			const w = container.createDiv('budget-alert budget-alert-danger');
			w.createEl('strong', { text: 'Periodo cerrado. ' });
			w.appendText('No se pueden agregar transacciones.');
			return;
		}

		container.createEl('h3', { text: 'Nueva transaccion' });

		const typeRow = container.createDiv('budget-type-toggle');
		const incBtn = typeRow.createEl('button', { text: '➕ Ingreso', cls: `budget-type-btn${this.addType === 'income' ? ' active' : ''}` });
		const expBtn = typeRow.createEl('button', { text: '➖ Gasto', cls: `budget-type-btn${this.addType === 'expense' ? ' active' : ''}` });
		incBtn.addEventListener('click', () => { this.addType = 'income'; this.render(); });
		expBtn.addEventListener('click', () => { this.addType = 'expense'; this.render(); });

		const form = container.createDiv('budget-form');
		let descVal = '';
		let amountVal = '';
		let dateVal = new Date().toISOString().split('T')[0];
		let categoryVal: TransactionCategory = this.addType === 'income' ? 'salary' : 'food';
		let noteVal = '';

		new Setting(form).setName('Descripcion').setDesc('En que o de que?')
			.addText(t => { t.setPlaceholder('Ej: Salario de abril'); t.onChange(v => { descVal = v; }); });

		new Setting(form).setName('Monto').setDesc(this.plugin.data.settings.currencyCode)
			.addText(t => { t.inputEl.type = 'number'; t.inputEl.min = '0'; t.setPlaceholder('0'); t.onChange(v => { amountVal = v; }); });

		new Setting(form).setName('Fecha')
			.addText(t => { t.inputEl.type = 'date'; t.inputEl.value = dateVal; t.onChange(v => { dateVal = v; }); });

		const categories = this.addType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
		new Setting(form).setName('Categoria')
			.addDropdown(d => {
				for (const cat of categories) d.addOption(cat, CATEGORY_LABELS[cat]);
				categoryVal = categories[0];
				d.onChange(v => { categoryVal = v as TransactionCategory; });
			});

		new Setting(form).setName('Nota').setDesc('Opcional')
			.addText(t => { t.setPlaceholder('Detalles...'); t.onChange(v => { noteVal = v; }); });

		const saveBtn = form.createEl('button', { text: 'Guardar transaccion', cls: 'budget-btn-primary' });
		saveBtn.addEventListener('click', async () => {
			if (!descVal.trim()) { new Notice('La descripcion es obligatoria.'); return; }
			const amount = parseFloat(amountVal);
			if (!amount || amount <= 0) { new Notice('El monto debe ser mayor a 0.'); return; }

			this.manager.addTransaction(
				this.selectedPeriod, this.addType, categoryVal,
				descVal.trim(), amount, dateVal || undefined, noteVal.trim() || undefined
			);
			await this.plugin.saveData();
			new Notice(`${this.addType === 'income' ? 'Ingreso' : 'Gasto'} registrado: ${this.fmt(amount)}`);
			this.activeTab = 'transactions';
			this.render();
		});
	}

	// ─── Cierre ───────────────────────────────────────────────────────────────

	private renderClose(container: HTMLElement) {
		const month = this.manager.getPeriod(this.selectedPeriod);
		if (!month) return;

		const totalIncome = this.manager.calcTotalIncome(month);
		const totalExpenses = this.manager.calcTotalExpenses(month);
		const netBalance = totalIncome - totalExpenses;
		const finalBalance = netBalance + month.carryOver;

		if (month.isClosed) {
			container.createEl('h3', { text: 'Mes cerrado ✅' });
			const info = container.createDiv('budget-close-info');
			info.createEl('p', { text: `Cerrado el ${new Date(month.closedAt!).toLocaleDateString('es-CO')}` });
			info.createEl('p', { text: `Saldo trasladado: ${this.fmt(finalBalance)}` });
			if (month.closingNote) info.createEl('p', { text: `Nota: ${month.closingNote}` });

			const btn = container.createEl('button', { text: '🔓 Reabrir mes', cls: 'budget-btn-warn' });
			btn.addEventListener('click', async () => {
				try {
					this.manager.reopenMonth(this.selectedPeriod);
					await this.plugin.saveData();
					new Notice('Mes reabierto.');
					this.render();
				} catch (e: any) { new Notice('Error: ' + e.message); }
			});
			return;
		}

		container.createEl('h3', { text: 'Cierre de mes 🔒' });

		const summary = container.createDiv('budget-close-summary');
		summary.createEl('h4', { text: 'Resumen previo al cierre' });
		const tbl = summary.createEl('table', { cls: 'budget-table' });
		const rows: [string, number][] = [
			['💰 Saldo arrastrado', month.carryOver],
			['➕ Total ingresos', totalIncome],
			['➖ Total gastos', totalExpenses],
			['📊 Balance neto del mes', netBalance],
			['🏦 Saldo que pasa al siguiente mes', finalBalance],
		];
		for (const [label, val] of rows) {
			const tr = tbl.createEl('tr');
			tr.createEl('td', { text: label });
			tr.createEl('td', { text: this.fmt(val), cls: `amount-cell ${val >= 0 ? 'positive' : 'negative'}` });
		}

		if (finalBalance < 0) {
			const w = container.createDiv('budget-alert budget-alert-danger');
			w.createEl('strong', { text: 'Deficit: ' });
			w.appendText(`Se arrastrara ${this.fmt(finalBalance)} como deuda al siguiente mes.`);
		} else {
			const ok = container.createDiv('budget-alert budget-alert-success');
			ok.createEl('strong', { text: 'Superavit: ' });
			ok.appendText(`${this.fmt(finalBalance)} pasaran al siguiente mes.`);
		}

		let closingNote = '';
		new Setting(container).setName('Nota de cierre').setDesc('Opcional')
			.addTextArea(ta => { ta.setPlaceholder('Observaciones del mes...'); ta.inputEl.rows = 3; ta.onChange(v => { closingNote = v; }); });

		const closeBtn = container.createEl('button', { text: 'Confirmar cierre del mes', cls: 'budget-btn-danger' });
		closeBtn.addEventListener('click', async () => {
			const msg = `Confirmar cierre de ${monthName(month.month)} ${month.year}?\n\nSaldo ${this.fmt(finalBalance)} pasara al siguiente mes.`;
			if (!confirm(msg)) return;
			try {
				const s = this.manager.closeMonth(this.selectedPeriod, closingNote || undefined);
				await this.plugin.saveData();
				if (this.plugin.data.settings.autoExportMarkdown) {
					await this.plugin.exportMarkdownReport(this.selectedPeriod);
				}
				new Notice(`Mes cerrado. Saldo ${this.fmt(s.finalBalance)} pasa al siguiente mes.`);
				this.selectedPeriod = this.manager.getData().meta.currentPeriod;
				this.activeTab = 'dashboard';
				this.render();
			} catch (e: any) { new Notice('Error: ' + e.message); }
		});
	}

	// ─── Historial ────────────────────────────────────────────────────────────

	private renderHistory(container: HTMLElement) {
		const history = this.manager.getClosingHistory();
		container.createEl('h3', { text: 'Historial de cierres' });

		if (history.length === 0) {
			container.createEl('p', { text: 'Aun no hay meses cerrados.', cls: 'budget-empty' });
			return;
		}

		const years = [...new Set(history.map(s => s.year))].sort((a, b) => b - a);
		for (const year of years) {
			const annual = this.manager.getAnnualSummary(year);
			const sec = container.createDiv('budget-year-section');
			sec.createEl('h4', { text: `${year} — Resumen anual` });
			const ac = sec.createDiv('budget-cards-sm');
			this.createCard(ac, '➕ Ingresos', this.fmt(annual.totalIncome), 'positive');
			this.createCard(ac, '➖ Gastos', this.fmt(annual.totalExpenses), 'negative');
			this.createCard(ac, '📊 Balance', this.fmt(annual.netBalance), annual.netBalance >= 0 ? 'positive' : 'negative');
		}

		container.createEl('h4', { text: 'Detalle por mes' });
		const table = container.createEl('table', { cls: 'budget-table' });
		const tr0 = table.createEl('thead').createEl('tr');
		['Periodo', 'Arrastre', 'Ingresos', 'Gastos', 'Balance', 'Saldo sig.'].forEach(h => tr0.createEl('th', { text: h }));
		const tbody = table.createEl('tbody');
		for (const s of history) {
			const tr = tbody.createEl('tr');
			tr.createEl('td', { text: `${monthName(s.month)} ${s.year}` });
			tr.createEl('td', { text: this.fmt(s.carryOverIn), cls: s.carryOverIn >= 0 ? 'positive' : 'negative' });
			tr.createEl('td', { text: this.fmt(s.totalIncome), cls: 'positive' });
			tr.createEl('td', { text: this.fmt(s.totalExpenses), cls: 'negative' });
			tr.createEl('td', { text: this.fmt(s.netBalance), cls: s.netBalance >= 0 ? 'positive' : 'negative' });
			tr.createEl('td', { text: this.fmt(s.finalBalance), cls: s.finalBalance >= 0 ? 'positive' : 'negative' });
		}
	}

	// ─── Helpers UI ───────────────────────────────────────────────────────────

	private createCard(container: HTMLElement, label: string, value: string, variant = 'neutral', highlight = false) {
		const card = container.createDiv(`budget-card${highlight ? ' highlight' : ''}`);
		card.createEl('div', { text: label, cls: 'budget-card-label' });
		card.createEl('div', { text: value, cls: `budget-card-value ${variant}` });
	}

	private fmt(n: number): string {
		const s = this.plugin.data.settings;
		const formatted = Math.abs(n).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
		return `${n < 0 ? '-' : ''}${s.currency}${formatted}`;
	}
}
