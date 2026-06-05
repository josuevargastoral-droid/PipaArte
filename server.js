const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 4000;

console.log(`[server] PORT configurado: ${PORT}`);


// =====================
// MongoDB Atlas (Mongoose)
// =====================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('[mongo] Falta MONGODB_URI en .env. Configura la variable y reinicia el servidor.');
} else {
  mongoose
    .connect(MONGODB_URI, { dbName: process.env.MONGODB_DBNAME || undefined })
    .then(() => console.log('[mongo] Conectado correctamente a MongoDB Atlas'))
    .catch((err) => console.error('[mongo] Error conectando a MongoDB Atlas:', err));
}


// =====================
// Modelo Producto
// =====================
const productoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    precio: { type: Number, required: true, min: 0 },
    imagen: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const Producto = mongoose.model('Producto', productoSchema);

// =====================
// Helpers
// =====================
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function safeTrim(s) {
  return typeof s === 'string' ? s.trim() : '';
}

function isValidImagenUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function toPayload(body) {
  const nombre = safeTrim(body?.nombre);
  const descripcion = safeTrim(body?.descripcion);
  const precio = typeof body?.precio === 'number' ? body.precio : Number(body?.precio);
  const imagen = safeTrim(body?.imagen);
  return { nombre, descripcion, precio, imagen };
}

function validateProducto(body) {
  const { nombre, descripcion, precio, imagen } = toPayload(body);
  const errors = [];

  if (!nombre) errors.push('Campo "nombre" es requerido.');
  if (!descripcion) errors.push('Campo "descripcion" es requerido.');
  if (!Number.isFinite(precio)) errors.push('Campo "precio" debe ser numérico.');
  else if (precio < 0) errors.push('Campo "precio" no puede ser negativo.');

  if (!imagen) errors.push('Campo "imagen" es requerido.');
  else if (!isValidImagenUrl(imagen)) errors.push('Campo "imagen" debe ser una URL http(s).');

  return { errors, producto: { nombre, descripcion, precio, imagen } };
}

// =====================
// CRUD /productos
// =====================

// GET /productos → obtener todos los registros.
app.get('/productos', async (req, res) => {
  try {
    const productos = await Producto.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ ok: true, productos });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Error interno' });
  }
});

// GET /productos/:id → obtener un registro específico.
app.get('/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ ok: false, error: 'ID inválido' });
    }

    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({ ok: false, error: 'Producto no encontrado' });
    }

    return res.status(200).json({ ok: true, producto });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Error interno' });
  }
});

// POST /productos → crear un nuevo registro.
app.post('/productos', async (req, res) => {
  try {
    const { errors, producto } = validateProducto(req.body);
    if (errors.length) {
      return res.status(400).json({ ok: false, error: errors.join(' ') });
    }

    const created = await Producto.create(producto);
    return res.status(201).json({ ok: true, producto: created });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Error interno' });
  }
});

// PUT /productos/:id → actualizar un registro existente.
app.put('/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ ok: false, error: 'ID inválido' });
    }

    const { errors, producto } = validateProducto(req.body);
    if (errors.length) {
      return res.status(400).json({ ok: false, error: errors.join(' ') });
    }

    const actual = await Producto.findById(id);
    if (!actual) {
      return res.status(404).json({ ok: false, error: 'Producto no encontrado' });
    }

    actual.nombre = producto.nombre;
    actual.descripcion = producto.descripcion;
    actual.precio = producto.precio;
    actual.imagen = producto.imagen;

    await actual.save();
    return res.status(200).json({ ok: true, producto: actual });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Error interno' });
  }
});

// DELETE /productos/:id → eliminar un registro.
app.delete('/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ ok: false, error: 'ID inválido' });
    }

    const deleted = await Producto.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ ok: false, error: 'Producto no encontrado' });
    }

    return res.status(200).json({ ok: true, message: 'Producto eliminado correctamente' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Error interno' });
  }
});

// =====================
// Rutas existentes (correo): /notificar-compra, /api/contact, /api/order
// =====================

const NOTIFY_TO = process.env.NOTIFY_TO || 'josuevargas.toral29@gmail.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function sendEmailWithResend({ subject, html, text }) {
  if (!RESEND_API_KEY) {
    throw new Error('Falta RESEND_API_KEY en .env (o variables de entorno).');
  }

  const { Resend } = require('resend');
  const resend = new Resend(RESEND_API_KEY);

  const from = 'PipaArte <onboarding@resend.dev>';

  return resend.emails.send({
    from,
    to: [NOTIFY_TO],
    subject,
    html,
    text,
  });
}

function safeString(s) {
  return typeof s === 'string' ? s.trim() : '';
}

// Ruta para enviar notificación de compra
app.post('/notificar-compra', async (req, res) => {
  try {
    const { nombreCliente, totalCompra } = req.body;

    const subject = 'Confirmación de compra';
    const html = `
      <h2>Gracias por tu compra, ${nombreCliente}!</h2>
      <p>El total de tu pedido es <strong>$${totalCompra}</strong>.</p>
      <p>Tu pedido ha sido recibido correctamente y pronto será procesado.</p>
    `;

    const resp = await sendEmailWithResend({ subject, html });
    console.log('[email] /notificar-compra OK:', resp);
    res.status(200).send('Correo de notificación enviado correctamente');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al enviar la notificación');
  }
});

function formatCart(cart) {
  if (!Array.isArray(cart) || cart.length === 0) return 'Carrito vacío';
  return cart
    .map((it) => {
      const id = safeString(it.id);
      const qty = Number(it.qty) || 0;
      return `- ${id} (x${qty})`;
    })
    .join('\n');
}

app.post('/api/contact', async (req, res) => {
  try {
    const name = safeString(req.body?.name);
    const email = safeString(req.body?.email);
    const message = safeString(req.body?.message);

    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, error: 'Faltan campos en el formulario.' });
    }

    const subject = `Nuevo mensaje Contacto | PipaArte (${name})`;

    const html = `
      <h2>Nuevo mensaje de Contacto</h2>
      <p><b>Nombre:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Mensaje:</b></p>
      <p style="white-space:pre-wrap">${message}</p>
      <hr />
      <p style="color:#666;font-size:12px">Enviado desde la tienda PipaArte</p>
    `;

    const text = `Nuevo mensaje de Contacto\n\nNombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`;

    await sendEmailWithResend({ subject, html, text });

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message || 'Error enviando correo' });
  }
});

app.post('/api/order', async (req, res) => {
  try {
    const email = safeString(req.body?.email);
    const cart = req.body?.cart;
    const total = Number(req.body?.total) || 0;
    const createdAt = safeString(req.body?.createdAt);

    if (!email) {
      return res.status(400).json({ ok: false, error: 'Falta email de la sesión/usuario.' });
    }

    const subject = `Nuevo pedido (checkout) | PipaArte (${email})`;
    const cartText = formatCart(cart);

    const html = `
      <h2>Nuevo pedido (checkout)</h2>
      <p><b>Email:</b> ${email}</p>
      <p><b>Total:</b> $${total.toFixed(2)} MXN</p>
      <p><b>Carrito:</b></p>
      <pre style="white-space:pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">${cartText}</pre>
      <p><b>Fecha:</b> ${createdAt || '-'}</p>
      <hr />
      <p style="color:#666;font-size:12px">Enviado desde la tienda PipaArte</p>
    `;

    const text = `Nuevo pedido (checkout)\n\nEmail: ${email}\nTotal: $${total.toFixed(2)} MXN\nFecha: ${createdAt || '-'}\n\nCarrito:\n${cartText}`;

    await sendEmailWithResend({ subject, html, text });

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message || 'Error enviando correo' });
  }
});


app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 PipaArte server corriendo en http://localhost:${PORT}`);
});

