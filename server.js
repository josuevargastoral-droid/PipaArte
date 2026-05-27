const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 3000;

const NOTIFY_TO = process.env.NOTIFY_TO || 'josuevargas.toral29@gmail.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function sendEmailWithResend({ subject, html, text }) {
  if (!RESEND_API_KEY) {
    throw new Error('Falta RESEND_API_KEY en .env (o variables de entorno).');
  }

  // Resend SDK (se carga dinámicamente para que el error sea claro si falta dependencias)
  const { Resend } = require('resend');
  const resend = new Resend(RESEND_API_KEY);

  // from permitido por Resend
  const from = 'PipaArte <onboarding@resend.dev>';

  return resend.emails.send({
    from,
    to: [NOTIFY_TO],
    subject,
    html,
    text
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
console.log(app._router.stack.map(r => r.route && r.route.path).filter(Boolean));

// Iniciar servidor
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));

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
  console.log(`PipaArte email notifier corriendo en http://localhost:${PORT}`);
});

