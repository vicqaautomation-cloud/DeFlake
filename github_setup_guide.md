# Cómo subir tu código a GitHub

Como no tienes la herramienta `gh` instalada y es una cuenta nueva, la forma más fácil es usar un **Personal Access Token (PAT)**.

## Paso 1: Inicializar Git (Yo lo haré por ti)
Ejecutaré los comandos para preparar tu carpeta local:
```bash
git init
git add .
git commit -m "Initial commit: DeFlake MVP"
git branch -M main
```

## Paso 2: Crear el Token en GitHub
1.  Ve a [GitHub Token Settings](https://github.com/settings/tokens/new).
2.  **Note**: Ponle "DeFlake Agent".
3.  **Expiration**: Ponle 30 days (o lo que quieras).
4.  **Select scopes**: Marca la casilla **`repo`** (Full control of private repositories).
5.  Haz click en **Generate token**.
6.  **COPIA EL TOKEN** (Empieza con `ghp_...`). No podrás verlo de nuevo.

## Paso 3: Conectar y Subir
Una vez tengas el token y la URL de tu "Nuevo Repositorio" (ej: `https://github.com/tu-usuario/DeFlake.git`), dame la instrucción así:

> "La URL es https://github.com/tu-usuario/DeFlake.git y mi token es ghp_..."

Yo ejecutaré:
```bash
git remote add origin https://<TOKEN>@github.com/tu-usuario/DeFlake.git
git push -u origin main
```
*(Nota: Usar el token en la URL es seguro en tu máquina local, pero recuerda que quedará en tu historial de git local).*
