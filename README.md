# PX Forge (Admin Dashboard) 🛡️
![Project Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite)

## 📸 Evidencia Visual
<div align="center">
  <img src="assets/screens/proyex_web1.jpeg" width="30%" />
  <img src="assets/screens/proyex_web2.jpeg" width="30%" />
  <img src="assets/screens/proyex_web3.jpeg" width="30%" />
  <br/><br/>
  <img src="assets/screens/proyex_web4.jpeg" width="30%" />
  <img src="assets/screens/proyex_web5.jpeg" width="30%" />
  <img src="assets/screens/proyex_web6.jpeg" width="30%" />
</div>

## 📖 Descripción Breve
PX Forge es el panel administrativo ("El Núcleo") que actúa como la central de control para gestionar, orquestar y monitorear proyectos, ferias tecnológicas y stands. Permite la administración total de exhibiciones técnicas funcionales, facilitando el trabajo de los organizadores para que los proyectos brillen de forma profesional.

## ✨ Características Principales
- **Gestión Avanzada de Proyectos:** Registro, edición, y soft-delete de stands y equipos de trabajo.
- **Analíticas en Tiempo Real:** Dashboard interactivo mostrando estadísticas de votos y desempeño por categorías.
- **Generador de Fichas (PDF & QR):** Creación y descarga masiva automatizada de gafetes/fichas con códigos QR para impresión física.
- **Motor de Evaluaciones:** Constructor visual interactivo para forjar, clonar y versionar rúbricas y criterios de evaluación.
- **Multimedia Segura:** Soporte backend-ready para cargar videos pitch e imágenes pesadas (hasta 500 MB) para un "Visualizer".

## 🏗️ Arquitectura y Stack Tecnológico
- **Frontend:** React 19 y Vite para un desarrollo veloz y HMR efectivo.
- **Estilos:** CSS Vanilla estructurado con temática obscura/verde Premium y patrones minimalistas de diseño UI/UX.
- **Ecosistema de Librerías:** 
   - `recharts` para las proyecciones visuales asíncronas.
   - `html2canvas` + `jspdf` para exportación offline de credenciales en el cliente web.
   - `qrcode.react` para enlazamiento físico-digital mediante cámaras móviles.
- **Patrones de Diseño:** Arquitectura de Single Page Application (SPA), inyección de Contextos base (`AuthContext`) e interfaces reactivas. 

## ⚙️ Prerrequisitos e Instalación
1. **Node.js** v18+ instalado.
2. Clonar el repositorio Web: 
   ```bash
   git clone https://github.com/IsaiasSinthesys03/Proyex_WEB.git
   ```
3. Instalar dependencias puras: 
   ```bash
   npm install
   ```
4. Configurar Entorno base:
   Crea un archivo `.env` en la raíz mapeando hacia la lógica de la Proyex API:
   ```env
   VITE_API_URL=http://localhost:5260
   ```
5. Ejecutar panel administrativo en modo programador: 
   ```bash
   npm run dev
   ```

## 📂 Estructura de Carpetas
```text
Proyex_WEB/
 ├── public/           # Assets estáticos y binarios limpios
 ├── src/
 │   ├── assets/       # Imágenes, SVG y branding del diseño original
 │   ├── contexts/     # Autenticación global y State Management (AuthContext)
 │   ├── index.css     # UI Framework core y paletas predefinidas (Dark Mode Nativo).
 │   ├── App.jsx       # Interfaz monolítica, ruteador reactivo y "PX Forge".
 │   └── main.jsx      # Punto de entrada estricto React
 ├── .env              # Variables locales de entorno seguras
 └── package.json      # Dependencias gestionadas de alto calado
```

## 👥 El Equipo
El desarrollo tecnológico y conceptual rara vez es solitario. La carga de diseño frontend interactivo, interconexión de bases asíncronas y orquestación de flujos lógicos han sido comandadas de forma metódica por este núcleo estratégico e ingenieril:

- **Braulio Isaias Bernal Padron**
- **Yeng Lee Salas Jimenez**
- **Erick Leonardo Lopez Hernandez**
- **Jonathan Aaron Perez Mendez**

### 🤖 IA-Augmented Development (+IA)
Este proyecto no solo representa código y esfuerzo puro, sino la innegable sinergia de la nueva era tecnológica. **La plataforma fue co-programada y escalada integrando flujos de IA-Augmented Engineering (+IA).** Actuando como un *Pair Programmer* incansable interconectado a nuestras terminales, la asistencia de Inteligencia Artificial le permitió a este equipo de élite exprimir su propia eficiencia al 200%, reducir cualquier riesgo de deuda técnica y orquestar arquitecturas limpias con una exactitud asombrosa. ¡Aquí demostramos que el futuro del código no es desplazar al humano, sino inyectarle **auténticos superpoderes** al desarrollador experto!

---
*(Información original del andamiaje base persistida a continuación)*

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
