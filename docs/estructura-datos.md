# Estructura de datos — data.json

El plugin guarda toda la información en un único archivo:

```
TuVault/.obsidian/plugins/monthly-budget-tracker/data.json
```

Este archivo se crea automáticamente la primera vez que activas el plugin y se actualiza cada vez que agregas una transacción o haces un cierre.

---

## Esquema completo

```json
{
  "settings": { ... },
  "months": { ... },
  "closingHistory": [ ... ],
  "meta": { ... }
}
```

---

## `settings` — Configuración del usuario

```json
{
  "settings": {
    "currency": "$",
    "currencyCode": "COP",
    "outputFolder": "Budget/cierres",
    "autoExportMarkdown": true,
    "defaultBudgetIncome": 3000000,
    "defaultBudgetExpenses": 2500000,
    "showCarryOverWarning": true,
    "decimalSeparator": ",",
    "firstDayOfMonth": 1
  }
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `currency` | string | Símbolo visual de moneda |
| `currencyCode` | string | Código ISO (COP, USD, EUR) |
| `outputFolder` | string | Ruta en el vault para exportar reportes |
| `autoExportMarkdown` | boolean | Exportar `.md` al cerrar el mes |
| `defaultBudgetIncome` | number | Presupuesto de ingresos por defecto |
| `defaultBudgetExpenses` | number | Límite de gastos por defecto |
| `showCarryOverWarning` | boolean | Alerta si el arrastre es negativo |
| `decimalSeparator` | `","` \| `"."` | Separador decimal |
| `firstDayOfMonth` | number | Día de inicio del mes (generalmente 1) |

---

## `months` — Registros mensuales

La clave de cada mes es `"YYYY-MM"` (ej: `"2025-04"`).

```json
{
  "months": {
    "2025-04": {
      "year": 2025,
      "month": 4,
      "transactions": [
        {
          "id": "1714000000000-abc1234",
          "date": "2025-04-01",
          "type": "income",
          "category": "salary",
          "description": "Salario abril",
          "amount": 3000000,
          "tags": [],
          "note": "Incluye bono"
        },
        {
          "id": "1714100000000-xyz5678",
          "date": "2025-04-05",
          "type": "expense",
          "category": "housing",
          "description": "Arriendo",
          "amount": 900000,
          "tags": ["fijo"],
          "note": null
        }
      ],
      "budget": {
        "budgetedIncome": 3000000,
        "budgetedExpenses": 2500000
      },
      "carryOver": 150000,
      "isClosed": true,
      "closedAt": "2025-04-30T23:45:00.000Z",
      "closingNote": "Mes tranquilo, se ahorró en comida."
    }
  }
}
```

### Campos de `MonthRecord`

| Campo | Tipo | Descripción |
|---|---|---|
| `year` | number | Año (ej: 2025) |
| `month` | number | Mes 1–12 |
| `transactions` | Transaction[] | Lista de movimientos |
| `budget` | MonthlyBudget | Presupuesto planeado |
| `carryOver` | number | Saldo arrastrado del mes anterior (puede ser negativo) |
| `isClosed` | boolean | Si el mes fue cerrado |
| `closedAt` | string \| undefined | Timestamp ISO del cierre |
| `closingNote` | string \| undefined | Nota escrita al cerrar |

### Campos de `Transaction`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | `timestamp-random` — identificador único |
| `date` | string | `"YYYY-MM-DD"` |
| `type` | `"income"` \| `"expense"` | Tipo de movimiento |
| `category` | TransactionCategory | Ver categorías disponibles |
| `description` | string | Descripción del movimiento |
| `amount` | number | Siempre positivo |
| `tags` | string[] | Etiquetas opcionales |
| `note` | string \| undefined | Nota adicional |

---

## `closingHistory` — Historial de cierres

Un registro por cada mes cerrado, ordenados cronológicamente.

```json
{
  "closingHistory": [
    {
      "year": 2025,
      "month": 4,
      "totalIncome": 3000000,
      "totalExpenses": 2600000,
      "netBalance": 400000,
      "carryOverIn": 150000,
      "finalBalance": 550000,
      "closedAt": "2025-04-30T23:45:00.000Z",
      "closingNote": "Mes tranquilo."
    }
  ]
}
```

| Campo | Descripción |
|---|---|
| `totalIncome` | Suma de todos los ingresos del mes |
| `totalExpenses` | Suma de todos los gastos del mes |
| `netBalance` | `totalIncome - totalExpenses` |
| `carryOverIn` | Saldo que llegó del mes anterior |
| `finalBalance` | `netBalance + carryOverIn` → pasa al siguiente mes |

---

## `meta` — Metadatos internos

```json
{
  "meta": {
    "version": "1.0.0",
    "lastSaved": "2025-05-01T10:30:00.000Z",
    "currentPeriod": "2025-05"
  }
}
```

| Campo | Descripción |
|---|---|
| `version` | Versión del plugin que guardó estos datos |
| `lastSaved` | Timestamp de la última escritura |
| `currentPeriod` | Período activo actual `"YYYY-MM"` |

---

## Fórmula del arrastre

```
finalBalance = (totalIncome - totalExpenses) + carryOver
```

Este `finalBalance` se convierte en el `carryOver` del mes siguiente.

- Si es **positivo** → dinero disponible que se suma a los ingresos del próximo mes
- Si es **negativo** → deuda que se descuenta del próximo mes

---

## Reporte Markdown generado

Al cerrar un mes se crea automáticamente:

```
TuVault/Budget/cierres/presupuesto-2025-04.md
```

El archivo contiene tablas con el resumen, todas las transacciones ordenadas, desglose por categoría y la nota de cierre.
