# Guía de Despliegue en Render

## Pasos para desplegar en Render:

### 1. Preparar el repositorio
```bash
git add .
git commit -m "Setup para Render"
git push origin main
```

### 2. En Render.com:
- Crea una nueva "Web Service"
- Conecta tu repositorio de GitHub
- **Build Command:** `cd backend && npm install && npm run build`
- **Start Command:** `node backend/dist/server.js`

### 3. Variables de entorno:
En el dashboard de Render, agrega las siguientes variables:

```
DB_CONNECTION_STRING=Server=tcp:serviapp1.database.windows.net,1433;Initial Catalog=free-sql-db-5298329;Persist Security Info=False;User ID=serviapp;Password=YOUR_PASSWORD;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;

AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=serviapp;AccountKey=YOUR_KEY;EndpointSuffix=core.windows.net

AZURE_BLOB_CONTAINER=fotosclientesyempleados
AZURE_ANTECEDENTES_CONTAINER=antecedentes
AZURE_EVIDENCIAS_CONTAINER=evidencias

PORT=3000
```

### 4. Estructura del despliegue:
- **Frontend:** Servido desde Express (archivos estáticos)
- **Backend:** API en `/api/*`
- **URL:** `https://tu-proyecto.onrender.com`

## Características:
✅ Frontend y Backend en una sola aplicación  
✅ Base de datos Azure SQL  
✅ Almacenamiento Azure Blob  
✅ CORS habilitado  

