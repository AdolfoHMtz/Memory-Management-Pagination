# 📄 Simulador de Gestión de Memoria — Paginación

Simulador visual para la materia **Sistemas Operativos** que muestra, paso a paso, cómo funciona la **paginación**: cómo se dividen los trabajos en páginas, cómo se cargan en los marcos de la memoria principal y cómo se traduce una **dirección virtual (DV) a dirección física (DF)**.

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)

## Qué muestra

Ejercicio con memoria principal de **700 KB** y páginas de **100 KB** (7 marcos), en 5 pasos: llegan los trabajos T1 a T4, sale T1, y se traduce una dirección de cada uno.

En cada paso se ven:
1. Memoria secundaria (páginas del trabajo activo)
2. Memoria principal (marcos)
3. Tabla de mapa de páginas (TMP) del trabajo
4. Tabla global de marcos
5. Cálculo DV → DF paso a paso
6. Conexión visual entre memoria secundaria y principal
7. Ficha del trabajo actual con selector de DV

> Ver también: [Simulador de Particiones](https://github.com/AdolfoHMtz/Memory-Management).

## Cómo ejecutarlo

```bash
npm install
npm run dev
```

## Autor

**Adolfo Huerta** · [@AdolfoHMtz](https://github.com/AdolfoHMtz) · 2025
