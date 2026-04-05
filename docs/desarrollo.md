# Guía de desarrollo

Todo lo necesario para modificar o extender el plugin.

---

## Requisitos

- Node.js >= 16 (`node --version`)
- npm >= 7
- Un vault de Obsidian para pruebas

---

## Setup inicial

```bash
# Clona el repo dentro de tu vault de desarrollo
cd TuVaultDev/.obsidian/plugins/
git clone https://github.com/tu-usuario/monthly-budget-tracker
cd monthly-budget-tracker

# Instala dependencias
npm install

# Compila en modo watch (recompila al guardar)
npm run dev
```

Luego en Obsidian: **Settings → Community plugins → Activar "Monthly Budget Tracker"**

Cada vez que guardes un archivo `.ts`, el plugin se recompila automáticamente. Recarga Obsidian con `Ctrl+R` para ver los cambios.

---

## Estructura del código

```
src/
├── types.ts            # Interfaces TypeScript y constantes
├── budget-manager.ts   # Lógica de negocio pura (sin UI)
├── modal.ts            # Modal principal con 5 pestañas
├── settings-tab.ts     # Panel de configuración en Settings
└── main.ts             # Plugin entry point — registra todo
```

### Flujo de datos

```
main.ts
  └── carga data.json → BudgetManager
        └── Modal / SettingsTab consumen BudgetManager
              └── Cambios → plugin.saveData() → data.json
```

### Capas

| Archivo | Responsabilidad |
|---|---|
| `types.ts` | Solo tipos e interfaces. Sin lógica. |
| `budget-manager.ts` | Toda la lógica de negocio. Sin referencias a Obsidian UI. |
| `modal.ts` | Solo UI. Llama a `budget-manager` para calcular. |
| `main.ts` | Orquesta todo. Registra comandos y settings. |

---

## Scripts disponibles

```bash
npm run dev      # Watch mode para desarrollo
npm run build    # Build de producción (minificado)
```

---

## Cómo agregar una nueva categoría

1. En `src/types.ts`, agrega la clave al tipo `TransactionCategory`:
```typescript
export type TransactionCategory =
  | 'salary'
  | 'tu-nueva-categoria'  // ← agregar aquí
  | ...
```

2. En el mismo archivo, agrega la etiqueta en `CATEGORY_LABELS`:
```typescript
export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  'tu-nueva-categoria': 'Tu Etiqueta',
  ...
}
```

3. Agrégala a `INCOME_CATEGORIES` o `EXPENSE_CATEGORIES` según corresponda:
```typescript
export const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'housing',
  'tu-nueva-categoria',  // ← aquí
  ...
]
```

---

## Cómo agregar una nueva pestaña al modal

1. En `src/modal.ts`, agrega el id al tipo `TabId`:
```typescript
type TabId = 'dashboard' | 'transactions' | 'add' | 'close' | 'history' | 'mi-tab';
```

2. Agrégala al array `tabs` en el método `render()`:
```typescript
const tabs = [
  ...
  { id: 'mi-tab', label: '🆕 Mi Tab' },
]
```

3. Agrega el case en el bloque de renderizado:
```typescript
else if (this.activeTab === 'mi-tab') this.renderMiTab(body);
```

4. Implementa el método:
```typescript
private renderMiTab(container: HTMLElement) {
  container.createEl('h3', { text: 'Mi nueva pestaña' });
  // ...
}
```

---

## Cómo agregar un nuevo campo a las transacciones

1. Agrega el campo en la interfaz `Transaction` en `types.ts`
2. Actualiza el formulario en `modal.ts` → `renderAdd()`
3. Actualiza el método `addTransaction()` en `budget-manager.ts`
4. Actualiza `generateMarkdownReport()` si quieres que aparezca en el reporte

---

## Migración de datos

Cuando cambies el esquema de `data.json`, actualiza la función `loadPluginData()` en `main.ts`:

```typescript
async loadPluginData() {
  const saved = await this.loadData();
  this.data = {
    settings: { ...DEFAULT_SETTINGS, ...(saved?.settings ?? {}) },
    months: saved?.months ?? {},
    // Si agregas un campo nuevo:
    nuevocampo: saved?.nuevocamp ?? valorDefault,
    ...
  }
}
```

El spread `{ ...DEFAULT_SETTINGS, ...saved.settings }` garantiza retrocompatibilidad — los campos que no existan en datos viejos toman el valor del default.

---

## Build de producción

```bash
npm run build
```

Genera `main.js` minificado. Los 3 archivos para distribuir son:
```
main.js
manifest.json
styles.css
```

---

## Publicar en el directorio oficial de Obsidian

1. Asegúrate de cumplir las [guías oficiales](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
2. Crea un release en GitHub con los 3 archivos como assets
3. Abre un PR en [obsidian-releases](https://github.com/obsidianmd/obsidian-releases)
