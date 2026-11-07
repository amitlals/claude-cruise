

# 

<div align="center">

```
   ██████╗██████╗ ██╗   ██╗██╗███████╗███████╗
  ██╔════╝██╔══██╗██║   ██║██║██╔════╝██╔════╝
  ██║     ██████╔╝██║   ██║██║███████╗█████╗  
  ██║     ██╔══██╗██║   ██║██║╚════██║██╔══╝  
  ╚██████╗██║  ██║╚██████╔╝██║███████║███████╗
   ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝╚══════╝╚══════╝
                    for Claude Code
```

### ⚡ Nunca vuelvas a encontrarte con un límite de tasa.

[![npm version](https://img.shields.io/npm/v/claude-cruise.svg)](https://www.npmjs.com/package/claude-cruise)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/amitlals/claude-cruise.svg)](https://github.com/amitlals/claude-cruise/stargazers)

**Claude Cruise** es un proxy inteligente que se sitúa entre Claude Code y la API de Anthropic.  
Previene los límites de tasa al cambiar automáticamente a modelos de respaldo cuando te acerques a tu cuota.

[🚀 Inicio Rápido](#-quick-start-for-beginners) • [📋 Prerrequisitos](#-prerequisites) • [🔄 Cómo Funciona](#-how-auto-routing-works) • [📺 Panel Web](#-web-dashboard) • [❓ FAQ](#-faq)

![cruise](https://github.com/user-attachments/assets/1657952f-430f-4de4-960e-e72fd5decffd)

</div>

---

## ⚠️ Importante: Con qué es compatible (Antes de comenzar)

> **Claude Cruise funciona solo con herramientas basadas en API.** NO funciona con el chat web de claude.ai.

| ✅ Compatible Con | ❌ NO es Compatible Con |
|--------------|----------------------|
| Claude Code (Extensión de VS Code) | claude.ai (chat web) |
| Claude Code (CLI / Terminal) | App móvil de Claude |
| Anthropic API (llamadas directas) | App de escritorio de Claude |
| Cualquier app que use `ANTHROPIC_BASE_URL` | Claude en el navegador |

---

## 🎯 El Problema que Soluciona

Estás programando con Claude Code. Todo va genial. De repente:

```
Error: Rate limit exceeded. Please try again later.
```

😱 Tu cuota del **plan Max de $100 o $200/mes** se ha agotado. Sin aviso. Sin visibilidad. Tienes que esperar horas.

**Claude Cruise soluciona esto** mediante:
- 🔮 **Predecir** cuándo alcanzarás el límite
- ⚡ **Cambiar automáticamente** a modelos de respaldo antes de que te bloqueen  
- 📊 **Mostrar** el uso en tiempo real en un panel
- 💰 **Ahorrar** entre un 20-40% en costos con enrutamiento inteligente

---

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener:

| Requisito | Cómo verificar | Cómo instalar |
|-------------|--------------|----------------|
| **Node.js** (v18+) | `node --version` | [nodejs.org](https://nodejs.org/) |
| **npm** | `npm --version` | Viene con Node.js |
| **Git** | `git --version` | [git-scm.com](https://git-scm.com/) |
| **VS Code** | Abre VS Code | [code.visualstudio.com](https://code.visualstudio.com/) |
| **Extensión Claude Code** | Revisa extensiones de VS Code | Busca "Claude" en Extensiones |
| **Clave API de Anthropic** | - | [console.anthropic.com](https://console.anthropic.com/) |

---

## 🚀 Inicio Rápido 

### Dos formas de usar Claude Cruise

| Método | Ideal para | Dificultad |
|--------|----------|------------|
| **[Opción A: Usar NPX](#option-a-use-npx-easiest)** | Inicio rápido, sin configuración | ⭐ Más fácil |
| **[Opción B: Clonar Repositorio](#option-b-clone-from-github-for-developers)** | Desarrolladores, colaboradores | ⭐⭐ Media |

---

## Opción A: Usar NPX (La más fácil)

Esta es la forma más rápida: ¡solo 3 comandos!

### Paso 1: Abrir la Terminal

**Windows:**
- Presiona `Win + R`, escribe `powershell`, presiona Enter

**macOS:**
- Presiona `Cmd + Espacio`, escribe `terminal`, presiona Enter

**Linux:**
- Presiona `Ctrl + Alt + T`

### Paso 2: Configurar tu clave API de Anthropic

Primero, obtén tu clave API en [console.anthropic.com](https://console.anthropic.com/) → API Keys → Create Key

Luego configúrala en tu terminal:

```powershell
# Windows PowerShell (copia y pega, reemplaza TU_CLAVE)
$env:ANTHROPIC_API_KEY = "sk-ant-api03-YOUR_KEY_HERE"
```

```bash
# macOS / Linux (copia y pega, reemplaza TU_CLAVE)
export ANTHROPIC_API_KEY="sk-ant-api03-YOUR_KEY_HERE"
```

### Paso 3: Ejecutar Claude Cruise

```bash
npx claude-cruise
```

Deberías ver:
```
⚡ Cruise proxy starting on port 4141...
✓ Cruise running at http://localhost:4141
```

### Paso 4: Configurar Claude Code para usar el proxy

En la **misma terminal** (o una nueva), configura la URL base:

```powershell
# Windows PowerShell
$env:ANTHROPIC_BASE_URL = "http://localhost:4141"
```

```bash
# macOS / Linux
export ANTHROPIC_BASE_URL="http://localhost:4141"
```

### Paso 5: Iniciar Claude Code

¡Ahora usa Claude Code como siempre! Abre VS Code y usa la extensión de Claude Code.

Todas las solicitudes pasarán por Claude Cruise, el cual:
- Rastrearán tu uso
- Mostrarán un panel en http://localhost:4141
- Cambiará modelos automáticamente cuando te acerques al límite de tasa

---

## Opción B: Clonar desde GitHub (Para desarrolladores)

Usa esta opción si deseas:
- Contribuir al proyecto
- Personalizar el código
- Ejecutar desde el código fuente

### Paso 1: Hacer Fork del repositorio (Opcional)

Si quieres contribuir o guardar tu propia copia:

1. Ve a [github.com/amitlals/claude-cruise](https://github.com/amitlals/claude-cruise)
2. Haz clic en el botón **Fork** (arriba a la derecha)
3. Esto crea tu propia copia en `github.com/TU_USUARIO/claude-cruise`

### Paso 2: Clonar el repositorio

Abre tu terminal y ejecuta:

```bash
# Si hiciste fork (reemplaza TU_USUARIO):
git clone https://github.com/TU_USUARIO/claude-cruise.git

# O clona directamente desde el original:
git clone https://github.com/amitlals/claude-cruise.git
```

### Paso 3: Navegar a la carpeta del proyecto

```bash
cd claude-cruise
```

Tu terminal ahora debería mostrar algo como:
```
C:\Users\TuNombre\claude-cruise>      # Windows
~/claude-cruise$                       # macOS/Linux
```

### Paso 4: Instalar las dependencias

```bash
npm install
```

Espera a que termine. Deberías ver:
```
added XXX packages in Xs
```

### Paso 5: Configurar tu clave API de Anthropic

Obtén tu clave en [console.anthropic.com](https://console.anthropic.com/) → API Keys

```powershell
# Windows PowerShell
$env:ANTHROPIC_API_KEY = "sk-ant-api03-YOUR_KEY_HERE"
```

```bash
# macOS / Linux
export ANTHROPIC_API_KEY="sk-ant-api03-YOUR_KEY_HERE"
```

### Paso 6: Iniciar Claude Cruise

```bash
npm run dev
```

O ejecuta el proxy directamente:

```bash
npx tsx src/proxy/server.ts
```

Deberías ver:
```
⚡ Cruise proxy starting on port 4141...
✓ Cruise running at http://localhost:4141
```

### Paso 7: Abrir otra terminal para Claude Code

**Importante:** ¡Mantén la primera terminal en ejecución! Abre una terminal NUEVA.

En la nueva terminal, configura la URL del proxy:

```powershell
# Windows PowerShell
$env:ANTHROPIC_BASE_URL = "http://localhost:4141"
```

```bash
# macOS / Linux
export ANTHROPIC_BASE_URL="http://localhost:4141"
```

### Paso 8: Usar Claude Code

Ahora abre VS Code y usa Claude Code como siempre. ¡Todas las solicitudes pasarán por Cruise!

---

## 📺 Panel Web

Abre tu navegador en **http://localhost:4141** para ver:

| Característica | Descripción |
|---------|-------------|
| 🎛️ **Medidor de uso** | Indicador visual que muestra lo cerca que estás del límite |
| 📊 **Estado del modelo** | Qué modelo está activo (Sonnet/Haiku/OpenRouter/Ollama) |
| 💰 **Seguimiento de costos** | Costos por sesión, de hoy y semanales |
| 📈 **Feed de actividad** | Registro en tiempo real de todas las solicitudes |
| 🔄 **Estado del enrutamiento** | Muestra cuándo el enrutamiento automático está activo |

Ejemplo -<br>
<img width="410" height="554" alt="image" src="https://github.com/user-attachments/assets/e3e26cf5-88c3-489f-842e-a8a53069b265" />

---

## 🔄 Cómo funciona el enrutamiento automático

Cuando te acerques a tu límite de tasa, Claude Cruise cambia automáticamente a modelos más económicos/de respaldo:

```
Nivel de uso          Modelo utilizado              Costo
─────────────────────────────────────────────────
0% - 70%      →      Claude Sonnet           $3/M tokens
70% - 85%     →      Claude Haiku            $0.8/M tokens (¡73% más barato!)
85% - 95%     →      OpenRouter              $3.5/M tokens (proveedor diferente)
95%+          →      Ollama (local)          GRATIS
```

### ¿Qué ocurre cuando te encuentras con un error 429?

1. **Detección** — Cruise identifica el error de límite de tasa
2. **Aprendizaje** — Registra cuántos tokens lo dispararon
3. **Cambio** — Enruta al siguiente proveedor inmediatamente
4. **Recuperación** — Vuelve al primario después de ~5 horas

---

## 🔑 Configurar proveedores de respaldo (Opcional)

Para una mejor protección, agrega proveedores de respaldo:

### OpenRouter (Respaldo en la nube)

1. Ve a [openrouter.ai](https://openrouter.ai/)
2. Regístrate y obtén una clave API
3. Configúrala:
```bash
export OPENROUTER_API_KEY="sk-or-v1-YOUR_KEY"
```

### Ollama (Respaldo local gratuito)

1. Instala desde [ollama.ai](https://ollama.ai/)
2. Descarga un modelo: `ollama pull qwen2.5-coder:32b`
3. Habilítalo en Cruise:
```bash
export OLLAMA_ENABLED=true
```

---

## 🛠️ Solución de problemas

### Error "Cannot find module"
```bash
# Asegúrate de estar en el directorio correcto
cd claude-cruise
npm install
```

### Error "ANTHROPIC_API_KEY not set"
```bash
# Configura tu clave API nuevamente (se reinicia al cerrar la terminal)
$env:ANTHROPIC_API_KEY = "sk-ant-api03-..."   # Windows
export ANTHROPIC_API_KEY="sk-ant-api03-..."   # macOS/Linux
```

### El panel no carga
1. Asegúrate de que el servidor esté en ejecución (revisa la terminal por `✓ Cruise running`)
2. Prueba http://localhost:4141 (no https)
3. Verifica si el puerto 4141 está bloqueado por el firewall

### Claude Code no está usando el proxy
```bash
# Asegúrate de que ANTHROPIC_BASE_URL esté configurada
echo $env:ANTHROPIC_BASE_URL   # Windows PowerShell
echo $ANTHROPIC_BASE_URL       # macOS/Linux
# Debería mostrar: http://localhost:4141
```

---

## 🤝 Contribuir

¡Agradecemos las contribuciones! Aquí te explicamos cómo:

1. Haz **Fork** del repositorio en GitHub
2. **Clona** tu fork localmente
3. **Crea una rama**: `git checkout -b my-feature`
4. **Realiza cambios** y pruébalos
5. **Commit**: `git commit -m "Add my feature"`
6. **Push**: `git push origin my-feature`
7. **Abre un Pull Request** en GitHub

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para obtener pautas detalladas.

---

## ❓ Preguntas Frecuentes (FAQ)

**P: ¿Funciona con el chat web de claude.ai?**  
R: No. claude.ai se conecta directamente a Anthropic desde tu navegador. Solo se pueden proxyar las herramientas basadas en API.

**P: ¿Está segura mi clave API?**  
R: Sí. Tu clave nunca sale de tu máquina. Cruise se ejecuta localmente.

**P: ¿Esto afectará la calidad de las respuestas?**  
R: Al usar Sonnet, no hay cambio. Haiku es ligeramente menos capaz pero mucho más rápido y económico.

**P: ¿Cómo detengo Claude Cruise?**  
R: Presiona `Ctrl+C` en la terminal donde se está ejecutando.

---

## 📄 Licencia

Licencia MIT - consulta el archivo [LICENSE](LICENSE).

---

## ⚠️ Aviso Legal

**Importante:** Este proyecto es una herramienta independiente impulsada por la comunidad y **NO está afiliada, respaldada ni soportada por Anthropic PBC**. Claude Code y Claude son marcas registradas de Anthropic.

Claude Cruise es una herramienta de monitoreo y enrutamiento que opera como un proxy transparente. No:
- Modifica ni intercepta respuestas de la API de manera inapropiada
- Viola los Términos de Servicio de Anthropic
- Elude mecanismos de seguridad o autenticación
- Almacena ni transmite claves API a terceros

**Úsalo bajo tu propio riesgo.** Los autores no se hacen responsables de:
- Decisiones de gestión de cuota de API tomadas por esta herramienta
- Costos incurridos a través del enrutamiento automático
- Cualquier violación de los términos de servicio de terceros

Revisa siempre el uso y los costos de tu API a través de los paneles oficiales del proveedor.

---

## 💖 Apoya este proyecto

Si Claude Cruise te ahorra tiempo y frustración, considera apoyar su desarrollo:

<a href="https://ko-fi.com/amitlall" target="_blank">
  <img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support me on Ko-fi" />
</a>

Tu apoyo ayuda a:
- 🔧 Mantener y mejorar la base de código
- 🚀 Agregar nuevas funciones y proveedores
- 📚 Mantener la documentación actualizada
- ☕ ¡Impulsar sesiones de código a medianoche!

---

<div align="center">

**⚡ Deja de topar con los límites de tasa. Empieza a entregar.**

Construido con ❤️ por [Amit Lal](https://github.com/amitlals)

[⭐ Dar estrella en GitHub](https://github.com/amitlals/claude-cruise) • [🐛 Reportar error](https://github.com/amitlals/claude-cruise/issues) • [💡 Solicitar función](https://github.com/amitlals/claude-cruise/issues) • [☕ Invítame un café](https://ko-fi.com/amitlall)

</div>
