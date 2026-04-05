# Cómo contribuir

¡Gracias por tu interés en mejorar el plugin!

---

## Reportar un bug

Usa la plantilla **Bug Report** en [Issues](../../issues/new/choose).

Incluye:
- Versión del plugin y de Obsidian
- Sistema operativo o dispositivo
- Pasos exactos para reproducir el problema
- Qué esperabas que pasara vs qué pasó

---

## Proponer una funcionalidad

Usa la plantilla **Feature Request** en [Issues](../../issues/new/choose).

Describe el problema que resuelve y cómo imaginas que funcionaría.

---

## Enviar un Pull Request

1. Haz fork del repositorio
2. Crea una rama descriptiva:
   ```bash
   git checkout -b feature/exportar-csv
   # o
   git checkout -b fix/cierre-mes-negativo
   ```
3. Haz tus cambios — consulta [docs/desarrollo.md](docs/desarrollo.md)
4. Prueba en un vault real antes de enviar
5. Abre el PR con una descripción clara de qué cambia y por qué

---

## Estilo de código

- TypeScript estricto (`strictNullChecks: true`)
- Nombres de variables y funciones en **camelCase** en inglés o español consistente con el resto del archivo
- Comentarios en español
- Sin `console.log` en el código final (solo para debug temporal)
