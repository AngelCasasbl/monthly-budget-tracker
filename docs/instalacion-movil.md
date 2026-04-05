# Instalación en Android e iOS

El plugin funciona en móvil — `"isDesktopOnly": false` está configurado en el `manifest.json`.

---

## Android

### Método 1 — Transferencia directa (más simple)

**Lo que necesitas copiar al teléfono:**

```
main.js
manifest.json
styles.css
```

**Pasos:**

1. **Copia los 3 archivos** al teléfono (USB, Google Drive, WhatsApp, etc.)

2. **Crea la carpeta** en tu vault de Android:
   ```
   /storage/emulated/0/TuVault/.obsidian/plugins/monthly-budget-tracker/
   ```
   > Si no ves la carpeta `.obsidian`, activa "Mostrar archivos ocultos" en tu explorador de archivos.

3. **Pega los 3 archivos** dentro de esa carpeta.

4. En Obsidian Android:
   ```
   Settings → Community plugins → Recargar plugins → Activar "Monthly Budget Tracker"
   ```

---

### Método 2 — Obsidian Git

Si ya tienes tu vault en GitHub:

1. Instala el plugin **Obsidian Git** en Android
2. Clona tu repositorio — los plugins se sincronizan automáticamente
3. Activa el plugin en **Settings → Community plugins**

---

### Método 3 — Obsidian Sync

Si tienes suscripción a Obsidian Sync:

1. Activa el plugin en tu PC
2. Abre Obsidian en Android — se sincroniza automáticamente

---

## iOS (iPhone / iPad)

El proceso es el mismo que Android pero la ruta es diferente.

### Con la app Files

1. Abre la app **Archivos** en iOS
2. Navega a **En mi iPhone → Obsidian → TuVault → .obsidian → plugins**
3. Crea la carpeta `monthly-budget-tracker`
4. Copia los 3 archivos (`main.js`, `manifest.json`, `styles.css`) dentro

5. En Obsidian:
   ```
   Settings → Community plugins → Activar "Monthly Budget Tracker"
   ```

### Con iCloud Drive

Si tu vault está en iCloud:
```
iCloud Drive / Obsidian / TuVault / .obsidian / plugins / monthly-budget-tracker /
```

---

## Dónde se guardan los datos en móvil

Los datos se guardan en `data.json` dentro de la misma carpeta del plugin:

```
TuVault/.obsidian/plugins/monthly-budget-tracker/data.json
```

Este archivo es compatible entre desktop y móvil — puedes trabajar en ambos sin problemas si sincronizas tu vault.

---

## Permisos necesarios en Android

Obsidian necesita permiso de acceso a archivos. Si no lo tiene:

```
Ajustes del teléfono → Aplicaciones → Obsidian → Permisos → Almacenamiento → Permitir
```

En Android 11+ puede requerir permiso especial de "Acceso a todos los archivos".

---

## Solución de problemas

**El plugin no aparece en la lista:**
- Verifica que los 3 archivos están en la carpeta correcta
- Toca el botón de recargar en **Settings → Community plugins**
- Reinicia Obsidian

**Error al activar:**
- Asegúrate de que el archivo `main.js` no está corrupto (descárgalo de nuevo)
- Verifica que `manifest.json` está en la misma carpeta

**Los datos no se sincronizan entre PC y móvil:**
- Incluye la carpeta `.obsidian/plugins/` en tu servicio de sync
- Con Obsidian Sync está habilitado por defecto
- Con Git, asegúrate de no tener `.obsidian/` en el `.gitignore`
