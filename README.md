# 💰 Monthly Budget Tracker

> Plugin de Obsidian para gestión de presupuesto mensual con **cierres automáticos** y **arrastre de saldo**.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Obsidian](https://img.shields.io/badge/Obsidian-1.0.0+-purple)
![Platform](https://img.shields.io/badge/platform-desktop%20%7C%20android%20%7C%20iOS-green)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## ¿Qué hace este plugin?

Registra tus ingresos y gastos directamente en Obsidian. Al cerrar cada mes, el saldo sobrante (o la deuda) se arrastra automáticamente al mes siguiente — como un libro contable real.

```
Abril  →  ingresos $3.000.000 - gastos $2.600.000 = +$400.000  →  pasa a Mayo
Mayo   →  ingresos $3.000.000 - gastos $3.500.000 = -$500.000
           + arrastre +$400.000                    = -$100.000  →  pasa a Junio
Junio  →  ingresos $3.000.000 - gastos $2.800.000 = +$200.000
           + arrastre -$100.000                    = +$100.000  →  pasa a Julio
```

---

## Características

- **📊 Dashboard mensual** — resumen visual con saldo arrastrado, ingresos, gastos y balance final
- **➕ Registro rápido** — agrega ingresos y gastos con categoría, fecha y nota opcional
- **🔒 Cierre mensual** — cierra el mes con un clic; el saldo pasa automáticamente al siguiente
- **📄 Exportación Markdown** — cada cierre genera un reporte `.md` en tu vault
- **📅 Historial** — visualiza todos los meses cerrados con resumen anual
- **📊 Presupuesto** — define límites de ingresos y gastos esperados por mes
- **⚠️ Alertas** — aviso cuando el saldo es negativo o superas el presupuesto
- **📱 Compatible con Android e iOS**
- **💱 Configurable** — moneda, carpeta de exportación, presupuesto por defecto

---

## Instalación

### Opción A — Manual (recomendada para desarrollo)

```bash
# 1. Clona el repositorio en la carpeta de plugins de tu vault
cd TuVault/.obsidian/plugins/
git clone https://github.com/tu-usuario/monthly-budget-tracker

# 2. Instala dependencias
cd monthly-budget-tracker
npm install

# 3. Compila el plugin
npm run build

# 4. Activa en Obsidian
# Settings → Community plugins → Monthly Budget Tracker → Activar
```

### Opción B — Descarga directa

1. Ve a [Releases](../../releases/latest)
2. Descarga `monthly-budget-tracker.zip`
3. Descomprime en `TuVault/.obsidian/plugins/monthly-budget-tracker/`
4. Activa en **Settings → Community plugins**

### Opción C — Android / iOS

Copia estos 3 archivos al teléfono y colócalos en la carpeta de plugins:

```
main.js
manifest.json
styles.css
```

Ruta en Android:
```
/storage/emulated/0/TuVault/.obsidian/plugins/monthly-budget-tracker/
```

Ver guía completa → [docs/instalacion-movil.md](docs/instalacion-movil.md)

---

## Uso

### Abrir el panel

- Clic en el icono **💰** en la barra lateral izquierda
- O `Ctrl+P` → buscar *"Abrir presupuesto mensual"*

### Comandos disponibles

| Comando | Descripción |
|---|---|
| `Abrir presupuesto mensual` | Abre el panel principal |
| `Agregar ingreso rápido` | Abre directo al formulario de ingresos |
| `Agregar gasto rápido` | Abre directo al formulario de gastos |
| `Exportar mes actual a Markdown` | Genera el reporte `.md` del mes actual |

### Flujo mensual

```
Durante el mes
  └── Pestaña ➕ Agregar → registrar ingresos y gastos día a día

Fin de mes
  └── Pestaña 🔒 Cerrar mes → revisar resumen → Confirmar cierre

Mes siguiente
  └── Pestaña 📊 Resumen → el saldo arrastrado ya aparece automáticamente
```

---

## Categorías

### Ingresos
| Clave | Etiqueta |
|---|---|
| `salary` | Salario / nómina |
| `freelance` | Trabajo independiente |
| `investment` | Inversiones / rendimientos |
| `other_income` | Otros ingresos |

### Gastos
| Clave | Etiqueta |
|---|---|
| `housing` | Vivienda (arriendo, servicios) |
| `food` | Alimentación |
| `transport` | Transporte |
| `health` | Salud / medicina |
| `education` | Educación |
| `entertainment` | Entretenimiento / ocio |
| `savings` | Ahorro programado |
| `debt` | Pago de deudas |
| `other_expense` | Otros gastos |

---

## Configuración

**Settings → Community plugins → Monthly Budget Tracker → ⚙️ Options**

| Ajuste | Descripción | Default |
|---|---|---|
| Símbolo de moneda | `$`, `€`, `£`, etc. | `$` |
| Código de moneda | `COP`, `USD`, `EUR` | `COP` |
| Exportar al cerrar | Genera `.md` automáticamente | `true` |
| Carpeta de exportación | Ruta en el vault | `Budget/cierres` |
| Ingresos esperados | Presupuesto mensual de ingresos | `0` |
| Límite de gastos | Presupuesto mensual de gastos | `0` |
| Alerta saldo negativo | Aviso al iniciar con deuda | `true` |

---

## Estructura de datos

Todos los datos se guardan en:
```
TuVault/.obsidian/plugins/monthly-budget-tracker/data.json
```

Ver esquema completo → [docs/estructura-datos.md](docs/estructura-datos.md)

---

## Estructura del proyecto

```
monthly-budget-tracker/
├── src/
│   ├── main.ts              # Punto de entrada del plugin
│   ├── types.ts             # Interfaces y modelos de datos
│   ├── budget-manager.ts    # Lógica de negocio (cierres, cálculos)
│   ├── modal.ts             # UI principal (5 pestañas)
│   └── settings-tab.ts      # Panel de configuración
├── docs/
│   ├── estructura-datos.md  # Esquema de data.json
│   ├── instalacion-movil.md # Guía para Android/iOS
│   └── desarrollo.md        # Guía para contribuidores
├── .github/
│   ├── workflows/           # CI/CD con GitHub Actions
│   └── ISSUE_TEMPLATE/      # Plantillas de issues
├── manifest.json
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
├── styles.css
└── versions.json
```

---

## Desarrollo

```bash
npm run dev      # Watch mode — recompila al guardar
npm run build    # Build de producción (minificado)
```

Ver guía completa → [docs/desarrollo.md](docs/desarrollo.md)

---

## Contribuir

1. Fork del repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Haz tus cambios y pruébalos en un vault de desarrollo
4. Abre un Pull Request con descripción clara

Ver → [CONTRIBUTING.md](CONTRIBUTING.md)

---

## Reportar un problema

Usa las [plantillas de issues](.github/ISSUE_TEMPLATE/) para:
- 🐛 Reportar un bug
- 💡 Proponer una nueva funcionalidad

---

## Licencia

MIT © 2025 — Ver [LICENSE](LICENSE)
