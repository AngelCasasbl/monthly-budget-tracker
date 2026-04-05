import { App, PluginSettingTab, Setting } from 'obsidian';
import type MonthlyBudgetPlugin from './main';

export class BudgetSettingTab extends PluginSettingTab {
	plugin: MonthlyBudgetPlugin;

	constructor(app: App, plugin: MonthlyBudgetPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'Monthly Budget Tracker' });

		containerEl.createEl('h3', { text: 'Moneda' });

		new Setting(containerEl).setName('Simbolo de moneda').setDesc('Ej: $, €, £')
			.addText(t => t.setPlaceholder('$').setValue(this.plugin.data.settings.currency)
				.onChange(async v => { this.plugin.data.settings.currency = v || '$'; await this.plugin.saveData(); }));

		new Setting(containerEl).setName('Codigo de moneda').setDesc('Ej: COP, USD, EUR')
			.addText(t => t.setPlaceholder('COP').setValue(this.plugin.data.settings.currencyCode)
				.onChange(async v => { this.plugin.data.settings.currencyCode = v.toUpperCase() || 'COP'; await this.plugin.saveData(); }));

		containerEl.createEl('h3', { text: 'Presupuesto mensual por defecto' });

		new Setting(containerEl).setName('Ingresos esperados').setDesc('0 = sin presupuesto')
			.addText(t => t.setPlaceholder('0').setValue(String(this.plugin.data.settings.defaultBudgetIncome))
				.onChange(async v => { this.plugin.data.settings.defaultBudgetIncome = parseFloat(v) || 0; await this.plugin.saveData(); }));

		new Setting(containerEl).setName('Limite de gastos').setDesc('0 = sin limite')
			.addText(t => t.setPlaceholder('0').setValue(String(this.plugin.data.settings.defaultBudgetExpenses))
				.onChange(async v => { this.plugin.data.settings.defaultBudgetExpenses = parseFloat(v) || 0; await this.plugin.saveData(); }));

		containerEl.createEl('h3', { text: 'Exportacion Markdown' });

		new Setting(containerEl).setName('Exportar al cerrar el mes')
			.setDesc('Genera un archivo .md con el resumen al hacer el cierre.')
			.addToggle(t => t.setValue(this.plugin.data.settings.autoExportMarkdown)
				.onChange(async v => { this.plugin.data.settings.autoExportMarkdown = v; await this.plugin.saveData(); }));

		new Setting(containerEl).setName('Carpeta de exportacion').setDesc('Ruta en el vault. Ej: Finanzas/cierres')
			.addText(t => t.setPlaceholder('Budget/cierres').setValue(this.plugin.data.settings.outputFolder)
				.onChange(async v => { this.plugin.data.settings.outputFolder = v || 'Budget/cierres'; await this.plugin.saveData(); }));

		containerEl.createEl('h3', { text: 'Alertas' });

		new Setting(containerEl).setName('Alerta de saldo negativo')
			.setDesc('Avisa cuando el arrastre del mes sea negativo.')
			.addToggle(t => t.setValue(this.plugin.data.settings.showCarryOverWarning)
				.onChange(async v => { this.plugin.data.settings.showCarryOverWarning = v; await this.plugin.saveData(); }));

		containerEl.createEl('h3', { text: 'Datos' });

		new Setting(containerEl).setName('Exportar todos los reportes')
			.addButton(b => b.setButtonText('Exportar todo').onClick(async () => { await this.plugin.exportAllReports(); }));

		new Setting(containerEl).setName('Informacion')
			.setDesc(`Plugin v${this.plugin.manifest.version} · ${Object.keys(this.plugin.data.months).length} meses · ${this.plugin.data.closingHistory.length} cierres`);
	}
}
