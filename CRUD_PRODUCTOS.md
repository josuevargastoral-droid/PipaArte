# CRUD Productos PipaArte (Node/Express + MongoDB Atlas)

Incluye:
1) Rutas CRUD (`/productos`)
2) Códigos HTTP: **200**, **201**, **400**, **404**
3) Consumo desde frontend con **fetch + async/await**

---

## A) Backend: código CRUD (`server.js`) 

### Dependencia
```bash
npm i mongoose
```

### Variables de entorno (.env)
- `MONGODB_URI` (obligatorio)
- `MONGODB_DBNAME` (opcional)

---

### Modelo: Producto
Campos:
- `nombre`
- `descripcion`
- `precio`
- `imagen` (URL http/https)

---

### Rutas
- `GET /productos` → **200** { ok: true, productos: [...] }
- `GET /productos/:id` → **200** { ok: true, producto }
  - **400** si `:id` no es ObjectId válido
  - **404** si no existe
- `POST /productos` → **201** { ok: true, producto }
  - **400** si payload inválido
- `PUT /productos/:id` → **200** { ok: true, producto }
  - **400** si `:id` inválido o payload inválido
  - **404** si no existe
- `DELETE /productos/:id` → **200** { ok: true, message }
  - **400** si `:id` inválido
  - **404** si no existe

---

## B) Frontend: consumo con fetch/async/await (`script.js`)

Recomendado usar estas funciones:
- `loadProductos()` → `GET /productos` y render en `#products`
- `createProducto(payload)` → `POST /productos` y recarga
- `updateProducto(id, payload)` → `PUT /productos/:id` y recarga
- `deleteProducto(id)` → `DELETE /productos/:id` y recarga

### API base
```js
const API_BASE = 'http://localhost:4000';
```

### Ejemplo de `loadProductos()`
```js
async function loadProductos() {
  const resp = await fetch(`${API_BASE}/productos`);
  if (!resp.ok) throw new Error('Error cargando productos');
  const data = await resp.json();
  productosCache = data.productos || [];
  renderProductos(productosCache);
}
```

### Ejemplo de crear
```js
async function createProducto(payload) {
  const resp = await fetch(`${API_BASE}/productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data?.error || 'Error creando producto');
  await loadProductos();
}
```

### Ejemplo de editar
```js
async function updateProducto(id, payload) {
  const resp = await fetch(`${API_BASE}/productos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data?.error || 'Error actualizando producto');
  await loadProductos();
}
```

### Ejemplo de eliminar
```js
async function deleteProducto(id) {
  const resp = await fetch(`${API_BASE}/productos/${id}`, { method: 'DELETE' });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data?.error || 'Error eliminando producto');
  await loadProductos();
}
```

---

## C) Nota
Este archivo contiene el “contrato” esperado. El código final real se implementa en `server.js`, `productos.html` y `script.js` según el proyecto.
