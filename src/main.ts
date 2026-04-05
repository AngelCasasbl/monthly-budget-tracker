import { Plugin, Notice, TFile } from 'obsidian';
import { PluginData, DEFAULT_SETTINGS, currentPeriodKey } from './types';
import { BudgetManager } from './budget-manager';
import { BudgetModal } from './modal';
import { BudgetSettingTab } from './settings-tab';

export default class MonthlyBudgetPlugin extends Plugin {
	data!: PluginData;
	manager!: BudgetManager;

	async onload() {
		await this.loadPluginData();
		this.manager = new BudgetManager(this.data);
		this.manager.getCurrentPeriod();

		this.addRibbonIcon('wallet', 'Presupuesto mensual', () => {
			new BudgetModal(this.app, this).open();
		});

		this.addCommand({
			id: 'open-budget-modal',
			name: 'Abrir presupuesto mensual',
			callback: () => new BudgetModal(this.app, this).open(),
		});

		this.addCommand({
			id: 'quick-add-income',
			name: 'Agregar ingreso rapido',
			callback: () => {
				const modal = new BudgetModal(this.app, this);
				(modal as any).activeTab = 'add';
				(modal as any).addType = 'income';
				modal.open();
			},
		});

		this.addCommand({
			id: 'quick-add-expense',
			name: 'Agregar gasto rapido',
			callback: () => {
				const modal = new BudgetModal(this.app, this);
				(modal as any).activeTab = 'add';
				(modal as any).addType = 'expense';
				modal.open();
			},
		});

		this.addCommand({
			id: 'export-current-month',
			name: 'Exportar mes actual a Markdown',
			callback: async () => {
				await this.exportMarkdownReport(currentPeriodKey());
			},
		});

		const statusBarItem = this.addStatusBarItem();
		this.updateStatusBar(statusBarItem);
		this.registerInterval(
			window.setInterval(() => this.updateStatusBar(statusBarItem), 60_000)
		);

		this.addSettingTab(new BudgetSettingTab(this.app, this));

		const current = this.manager.getCurrentPeriod();
		if (this.data.settings.showCarryOverWarning && current.carryOver < 0 && !current.isClosed) {
			new Notice(`Aviso Budget: mes con arrastre negativo de ${this.formatAmount(current.carryOver)}.`, 8000);
		}

		console.log('Monthly Budget Tracker cargado');
	}

	onunload() {}

	async loadPluginData() {
		const saved = await this.loadData();
		if (!saved || !saved.months) {
			this.data = BudgetManager.createEmptyData(this.manifest.version);
		} else {
			this.data = {
				settings: { ...DEFAULT_SETTINGS, ...(saved.settings ?? {}) },
				months: saved.months ?? {},
				closingHistory: saved.closingHistory ?? [],
				meta: {
					version: this.manifest.version,
					lastSaved: new Date().toISOString(),
					currentPeriod: saved.meta?.currentPeriod ?? currentPeriodKey(),
				},
			};
		}
	}

	async saveData() {
		this.data.meta.lastSaved = new Date().toISOString();
		await super.saveData(this.data);
	}

	async exportMarkdownReport(periodKey: string): Promise<void> {
		const content = this.manager.generateMarkdownReport(periodKey, this.data.settings);
		if (!content) return;
		const [year, m] = periodKey.split('-');
		const fileName = `presupuesto-${year}-${m}.md`;
		const folderPath = this.data.settings.outputFolder.replace(/\/$/, '');
		const fullPath = `${folderPath}/${fileName}`;
		await this.ensureFolder(folderPath);
		const existing = this.app.vault.getAbstractFileByPath(fullPath);
		try {
			if (existing instanceof TFile) {
				await this.app.vault.modify(existing, content);
			} else {
				await this.app.vault.create(fullPath, content);
			}
			new Notice(`Reporte exportado: ${fullPath}`);
		} catch (e: any) {
			new Notice(`Error al exportar: ${e.message}`);
		}
	}

	async exportAllReports(): Promise<void> {
		const keys = this.manager.getAllPeriodKeys();
		for (const key of keys) { await this.exportMarkdownReport(key); }
		new Notice(`${keys.length} reportes exportados.`);
	}

	private async ensureFolder(path: string): Promise<void> {
		const parts = path.split('/');
		let current = '';
		for (const part of parts) {
			if (!part) continue;
			current = current ? `${current}/${part}` : part;
			if (!this.app.vault.getAbstractFileByPath(current)) {
				try { await this.app.vault.createFolder(current); } catch {}
			}
		}
	}

	private updateStatusBar(el: HTMLElement) {
		try {
			const month = this.manager.getCurrentPeriod();
			const balance = this.manager.calcFinalBalance(month);
			const icon = balance >= 0 ? '💰' : '⚠️';
			(el as any).setText(`${icon} ${this.formatAmount(balance)}`);
			el.title = `Saldo: ${this.formatAmount(balance)}`;
		} catch {
			(el as any).setText('💰 Budget');
		}
	}

	formatAmount(n: number): string {
		const s = this.data.settings;
		const formatted = Math.abs(n).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
		return `${n < 0 ? '-' : ''}${s.currency}${formatted}`;
	}
}
