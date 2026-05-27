/*
  PipaArte - script.js
  - Productos renderizados en productos.html
  - Carrito funcional con LocalStorage
  - Registro/Login funcional con LocalStorage + sesión persistente
*/

(() => {
  const STORAGE_USERS_KEY = 'pipaarte_users_v1';
  const STORAGE_SESSION_KEY = 'pipaarte_session_v1';
  const STORAGE_CART_KEY = 'pipaarte_cart_v1';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const money = (n) => {
    const num = Number(n) || 0;
    return num.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  };

  const readJSON = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const writeJSON = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(-50%) translateY(8px)';
      setTimeout(() => t.remove(), 250);
    }, 1700);
  }

  function normalizeEmail(email) {
    return (email || '').trim().toLowerCase();
  }

  // -------------------- Datos de productos (ejemplo) --------------------
  const PRODUCTS = [
    {
      id: 'flor-1',
      name: 'Ramo de Girasoles Vibrantes',
      price: 15,
      desc: 'Un conjunto artesanal de girasoles hechos con limpiapipas, reunidos en un ramo lleno de color y energía, perfecto para transmitir alegría y vitalidad.',
      img: 'https://scontent.fuio1-2.fna.fbcdn.net/v/t39.30808-6/695626493_1472759924545802_7899664511835452021_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=127cfc&_nc_ohc=1Klf7sr5ErEQ7kNvwGm1tqc&_nc_oc=Ado_YA2ltxcijQf43eVYYYctrtIq6UGY2tGHKsdS7-We1cUkvP0i8ZvMp2Mbrh6nxCGqhkZAtWLfRDKB8RtBQ-iZ&_nc_zt=23&_nc_ht=scontent.fuio1-2.fna&_nc_gid=-cjmqjt_RlG97Q2S8yhxhg&_nc_ss=7b2a8&oh=00_Af4kwTpbf2liFzetPUi6tb5tAezXwm4TPfT381B7M5j49A&oe=6A1C5428'
    },
    {
      id: 'flor-2',
      name: 'Flor de Loto Radiante',
      price: 14,
      desc: 'Una delicada flor de loto creada con limpiapipas, símbolo de paz y armonía, ideal para decorar espacios con un toque elegante y espiritual.',
      img: 'https://scontent.fuio1-2.fna.fbcdn.net/v/t39.30808-6/690631605_1472777377877390_5890356805991306700_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=127cfc&_nc_ohc=MsAmn4rYIPwQ7kNvwG826AS&_nc_oc=Adr4jhnEa6phUjXIUXg7muJaXHY4sp8pQv8o_tHHkMAlX0tuD90pDPU-1rbcNeqK3NfJpQAmSiI1wwADdouWJOka&_nc_zt=23&_nc_ht=scontent.fuio1-2.fna&_nc_gid=ZvNJ_bhS10k75jkmQculLg&_nc_ss=7b2a8&oh=00_Af4-Qni3cpUn_GWmXeha6tDCHgw3RcOg4oMNwwqNKqTibA&oe=6A1C4D05'
    },
    {
      id: 'fig-1',
      name: 'Flor Abstracta Corazón',
      price: 15,
      desc: 'Una composición original de limpiapipas con formas naturales y tonos cálidos. Su diseño único invita a la imaginación y puede interpretarse como un corazón, una flor abstracta o un detalle artístico.',
      img: 'https://scontent.fuio1-1.fna.fbcdn.net/v/t39.30808-6/694144435_1472782917876836_4743779552545219961_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=127cfc&_nc_ohc=Aoz3Nti97WAQ7kNvwGIZoxQ&_nc_oc=Adp4VnCpeKpkgQ8msqPnMaSsxa2hkFRgmZAnATRSKZa7RZYWMp_-e_kErRvQ9F_Xo2t__9GnaB2Kvodv8EBWB6nA&_nc_zt=23&_nc_ht=scontent.fuio1-1.fna&_nc_gid=lhNbl9lJIQN1eEWRsh2jIQ&_nc_ss=7b2a8&oh=00_Af5tk3T1UM2jWy0UCP5GdXfy-BUG7JzAkJZqxGp9y-v3NA&oe=6A1C6059'
    },
    {
      id: 'fig-2',
      name: 'Totoro Encantado',
      price: 12,
      desc: 'Figura inspirada en el personaje Totoro del anime Mi Vecino Totoro. Hecho con limpiapipas grises y detalles artesanales, transmite ternura y conexión con la naturaleza.',
      img: 'https://scontent.fuio1-2.fna.fbcdn.net/v/t39.30808-6/691714522_1472797994541995_2165362398500141164_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=127cfc&_nc_ohc=D0OdiuA0regQ7kNvwE_mi6E&_nc_oc=AdppL6j2_sOhhno91SR5kBAsSPtBjGqDc6nFmDj3MTJuJyG4TpXLuK_GNTnA1trkPmqsp_LDYyOjcPnCUjPAC4d1&_nc_zt=23&_nc_ht=scontent.fuio1-2.fna&_nc_gid=6QNbIiblB2j8rkTN7gT94w&_nc_ss=7b2a8&oh=00_Af7FqiOpfd0esCy5RmzF5SrA7j_CsFcT5TRgQeMGbJloIg&oe=6A1C4790'
    },
    {
      id: 'flor-3',
      name: 'Ratoncito Gris con Orejas Grandes',
      price: 12,
      desc: 'Un simpático ratoncito gris con orejas grandes, elaborado con limpiapipas. Su diseño sencillo y expresivo lo convierte en una pieza adorable y divertida.',
      img: 'https://scontent.fuio1-1.fna.fbcdn.net/v/t39.30808-6/694207397_1472797201208741_5215103069637359757_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=127cfc&_nc_ohc=_pm88SqSlkIQ7kNvwFGluBs&_nc_oc=AdrvENSbYX4f2Ax-EElZkalsgN3NmE8CFWS8eLyLC1DACL5FYhwofap3t_HZDnwJC__bIkIUflt-9TwTktRsut1j&_nc_zt=23&_nc_ht=scontent.fuio1-1.fna&_nc_gid=LyOXH8pTZ-l2OwO7ipfvnQ&_nc_ss=7b2a8&oh=00_Af6c_x1CjtBQw2mPPxG66yksWOWJhOwmua9Ftkue0sCg2w&oe=6A1C507C' 
    },
    {
      id: 'fig-3',
      name: 'Pollito amarillo',
      price: 8,
      desc: 'Pequeño pollito de color amarillo con detalles en naranja, hecho con limpiapipas. Representa inocencia y alegría, ideal como figura decorativa o regalo.',
      img: 'https://scontent.fuio1-1.fna.fbcdn.net/v/t39.30808-6/694645274_1472798741208587_6066079945099997867_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=127cfc&_nc_ohc=Gzgpmuv1wA8Q7kNvwGngbMF&_nc_oc=Adq-kivfvcbcuNUXw0ziyNGuJhFW-2XB9DR6qO7mLAHLy79yPHolbv0a19gwCC7L_b4mZOxalwXkpfmNLtQvM_qw&_nc_zt=23&_nc_ht=scontent.fuio1-1.fna&_nc_gid=exLgXzWzBGedxfeJ1FQP2w&_nc_ss=7b2a8&oh=00_Af4b7LV6JtlD50jKYLhx3SFMuBnEXbx95T4fscR2wEAfSw&oe=6A1C6408'
    },


    // Nuevos productos (total 9)
    {
      id: 'flor-4',
      name: 'Llavero de Medusa Azulada',
      price: 3,
      desc: 'Figura colgante azul con forma de medusa o flor marina, hecha con limpiapipas y detalles colgantes que simulan pétalos o tentáculos. Su estilo es fresco, divertido y artesanal, ideal para quienes aman los diseños únicos.',
      img: 'https://scontent.fuio1-1.fna.fbcdn.net/v/t39.30808-6/693630568_1472804524541342_1825968148552657812_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=127cfc&_nc_ohc=n1IkCQg_PKsQ7kNvwFOoU-7&_nc_oc=AdoKKj0Hx1KYq49zqy64ff3ynp6HTDm0Z-hvaz9IyJQLV4gBhlxzrBlWDeXzrkkQPxKINZxAog5SlhjmLi0ghUVs&_nc_zt=23&_nc_ht=scontent.fuio1-1.fna&_nc_gid=PC-YqYw4gbzoTMgF7uq90g&_nc_ss=7b2a8&oh=00_Af4Cy5i7Rdpoc7h1nJr3EZNnckp2uldHZfi3SRMnVWVUvQ&oe=6A1C3252'
    },
    {
      id: 'fig-4',
      name: 'Llavero de Fresa Jugosa',
      price: 3,
      desc: 'Dos pequeñas fresas rojas unidas por tallos verdes, elaboradas con limpiapipas. Su aspecto fresco y colorido transmite alegría y encanto natural, perfecto como accesorio decorativo o regalo artesanal.',
      img: 'https://scontent.fuio1-1.fna.fbcdn.net/v/t39.30808-6/693575475_1472804594541335_8085640367950017377_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=127cfc&_nc_ohc=sW9qSXUSH1UQ7kNvwEO6xW_&_nc_oc=AdqZrWY_dkNlEhnf7IbPPzwSbTeRmTSJ7x_V-_zkkRjoucZNYg9caY1nMMfI1RNYK_Nc8uWXiGZwzjNC35gXIkRb&_nc_zt=23&_nc_ht=scontent.fuio1-1.fna&_nc_gid=bAIeLbsjUIZ5BAREN7Xt2A&_nc_ss=7b2a8&oh=00_Af6G2f-YgrgYK9FAR_X2mfSeUzNBmhTrsyoWsUy4-OtGAA&oe=6A1C419F'
    },
    {
      id: 'flor-5',
      name: 'Llavero Susuwatari (Espíritu de Hollín)',
      price: 3,
      desc: 'Pequeño llavero hecho con limpiapipas negros y ojos grandes, que recrea a los simpáticos espíritus de hollín del anime japonés. Su diseño tierno y misterioso lo convierte en un accesorio único para fans del estilo Ghibli o amantes de lo artesanal.',
      img: 'https://scontent.fuio1-2.fna.fbcdn.net/v/t39.30808-6/691217798_1472804691207992_8358897349312961641_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=127cfc&_nc_ohc=Ny3QGWudHN8Q7kNvwH1nAc4&_nc_oc=AdqTVqDPizN29-tqW4nCYpRWOe1IkYbz43ujfY1RJzkeMAxcu7VL3VJcZz7SbzEc95jv6Q-BNYmWP-ifm4l4GFTp&_nc_zt=23&_nc_ht=scontent.fuio1-2.fna&_nc_gid=hzjX4qZibrt5J24kwp3Pcg&_nc_ss=7b2a8&oh=00_Af4QYzmtSDIlGE9Yt7jqDEMp8HweAWpiIwxo4CYWgWFkDg&oe=6A1C3A09'
    }
  ];


  // -------------------- Carrito --------------------
  function getCart() {
    return readJSON(STORAGE_CART_KEY, []); // [{id, qty}]
  }

  function setCart(cart) {
    writeJSON(STORAGE_CART_KEY, cart);
    updateCartUI();
  }

  function cartCount() {
    return getCart().reduce((acc, it) => acc + (Number(it.qty) || 0), 0);
  }

  function getCartItemById(id) {
    return getCart().find((x) => x.id === id);
  }

  function addToCart(productId, qty = 1) {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return;

    const cart = getCart();
    const existing = cart.find((x) => x.id === productId);
    if (existing) existing.qty += qty;
    else cart.push({ id: productId, qty });

    setCart(cart);
    toast('Agregado al carrito ✨');
  }

  function updateQty(productId, newQty) {
    const cart = getCart();
    const idx = cart.findIndex((x) => x.id === productId);
    if (idx === -1) return;

    const qty = Number(newQty) || 0;
    if (qty <= 0) cart.splice(idx, 1);
    else cart[idx].qty = qty;

    setCart(cart);
  }

  function clearCart() {
    localStorage.removeItem(STORAGE_CART_KEY);
    updateCartUI();
    toast('Carrito vacío');
  }

  function renderProductsIfNeeded() {
    const productsRoot = $('#products');
    if (!productsRoot) return;

    productsRoot.innerHTML = '';

    PRODUCTS.forEach((p) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <div class="product-img">
          <img src="${p.img}" alt="${p.name}" loading="lazy" />
        </div>
        <div class="card-body">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
            <div>
              <div style="font-weight:900; font-size:16px; line-height:1.2;">${p.name}</div>
              <div class="price">${money(p.price)}</div>
            </div>
            <div class="icon-badge" title="Hecho a mano" aria-hidden="true">🌸</div>
          </div>
          <p class="desc">${p.desc}</p>
          <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn btn-primary" data-add-to-cart="${p.id}" type="button">
              + Agregar al carrito
            </button>
          </div>
        </div>
      `;
      productsRoot.appendChild(card);
    });

    $$('[data-add-to-cart]').forEach((btn) => {
      btn.addEventListener('click', () => addToCart(btn.getAttribute('data-add-to-cart'), 1));
    });
  }

  function renderCartDrawerIfNeeded() {
    const drawer = $('#cartDrawer');
    if (!drawer) return;

    const itemsRoot = $('#cartItems');
    const totalEl = $('#cartTotal');

    const cart = getCart();
    itemsRoot.innerHTML = '';

    let total = 0;

    if (cart.length === 0) {
      itemsRoot.innerHTML = `
        <div style="color:var(--muted); padding:10px 0; line-height:1.6;">
          Tu carrito está vacío. Agrega productos desde “Productos”.
        </div>
      `;
      totalEl.textContent = money(0);
      return;
    }

    cart.forEach((it) => {
      const p = PRODUCTS.find((x) => x.id === it.id);
      if (!p) return;

      const line = document.createElement('div');
      line.className = 'cart-item';

      const lineTotal = (Number(p.price) || 0) * (Number(it.qty) || 0);
      total += lineTotal;

      line.innerHTML = `
        <img src="${p.img}" alt="${p.name}" />
        <div>
          <div class="title">${p.name}</div>
          <div class="sub">${money(p.price)} • Cantidad: ${it.qty}</div>
          <div style="margin-top:8px; color:var(--muted); font-size:13px;">Subtotal: <b style="color:var(--text);">${money(lineTotal)}</b></div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:10px;">
          <div class="qty-controls" aria-label="Controles de cantidad">
            <button class="qty-btn" data-qty-minus="${p.id}" type="button" aria-label="Disminuir">−</button>
            <span style="min-width:24px; text-align:center; font-weight:900;">${it.qty}</span>
            <button class="qty-btn" data-qty-plus="${p.id}" type="button" aria-label="Aumentar">+</button>
          </div>
          <button class="btn btn-danger" data-remove="${p.id}" type="button" style="padding:8px 10px;">Quitar</button>
        </div>
      `;

      itemsRoot.appendChild(line);
    });

    totalEl.textContent = money(total);

    $$('[data-qty-plus]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-qty-plus');
        const item = getCartItemById(id);
        updateQty(id, (item?.qty || 0) + 1);
      });
    });

    $$('[data-qty-minus]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-qty-minus');
        const item = getCartItemById(id);
        updateQty(id, (item?.qty || 0) - 1);
      });
    });

    $$('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-remove');
        updateQty(id, 0);
        toast('Producto removido');
      });
    });
  }

  function updateCartUI() {
    const count = cartCount();
    const countEl = $('#cartCount');
    if (countEl) countEl.textContent = String(count);

    const isCartOpenPage = !!$('#cartDrawer');
    if (isCartOpenPage) {
      // render parcial seguro
      renderCartDrawerIfNeeded();
    }
  }

  function initCartInteractions() {
    const drawer = $('#cartDrawer');
    const openBtn = $('#openCartBtn');
    const closeBtn = $('#closeCartBtn');
    const clearBtn = $('#clearCartBtn');
    const checkoutBtn = $('#checkoutBtn');

    if (!drawer || !openBtn) return;

    updateCartUI();

    const open = () => {
      drawer.hidden = false;
      drawer.style.display = 'block';
    };
    const close = () => {
      drawer.hidden = true;
      drawer.style.display = '';
    };

    openBtn.addEventListener('click', () => open());
    closeBtn?.addEventListener('click', () => close());

    clearBtn?.addEventListener('click', () => {
      clearCart();
    });

    checkoutBtn?.addEventListener('click', async () => {
      const cart = getCart();
      if (cart.length === 0) {
        toast('Carrito vacío');
        return;
      }

      const user = getSessionUser();
      if (!user) {
        toast('Inicia sesión para finalizar');
        window.location.href = 'login.html';
        return;
      }

      // calcular total (para el email)
      let total = 0;
      cart.forEach((it) => {
        const p = PRODUCTS.find((x) => x.id === it.id);
        total += (Number(p?.price) || 0) * (Number(it.qty) || 0);
      });

      try {
        toast('Enviando notificación...');

        const createdAt = new Date().toISOString();
        const resp = await fetch('http://localhost:3000/api/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            cart,
            total,
            createdAt
          })
        });

        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          throw new Error(data?.error || 'Error enviando orden');
        }

        toast('Notificado ✅ ¡Pedido finalizado! 🎉');

        // En demo, vaciamos carrito
        localStorage.removeItem(STORAGE_CART_KEY);
        updateCartUI();
      } catch (err) {
        console.error(err);
        toast(`No se pudo notificar: ${err?.message || err}`);
      }
    });

    // Cerrar al presionar ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !drawer.hidden) close();
    });
  }

  // -------------------- Usuarios / Sesión --------------------
  function getUsers() {
    return readJSON(STORAGE_USERS_KEY, []); // [{name,email,passwordHashOrPlain}]
  }

  function setUsers(users) {
    writeJSON(STORAGE_USERS_KEY, users);
  }

  function setSession(email) {
    writeJSON(STORAGE_SESSION_KEY, { email: normalizeEmail(email), at: Date.now() });
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_SESSION_KEY);
  }

  function getSessionUser() {
    const s = readJSON(STORAGE_SESSION_KEY, null);
    if (!s?.email) return null;
    const users = getUsers();
    return users.find((u) => normalizeEmail(u.email) === normalizeEmail(s.email)) || null;
  }

  function updateSessionUI() {
    const sessionInfoEl = $('#sessionInfo');
    const logoutBtn = $('#logoutBtn');
    const usersCountEl = $('#usersCount');

    if (usersCountEl) {
      const users = getUsers();
      usersCountEl.textContent = users.length
        ? `${users.length} usuario(s) guardado(s) en este navegador.`
        : 'Aún no hay usuarios guardados.';
    }

    if (sessionInfoEl) {
      const user = getSessionUser();
      if (!user) {
        sessionInfoEl.textContent = 'No hay sesión activa.';
        if (logoutBtn) logoutBtn.hidden = true;
        return;
      }
      sessionInfoEl.innerHTML = `
        <div style="font-weight:900; margin-bottom:4px;">${user.name}</div>
        <div style="color:var(--muted);">${user.email}</div>
      `;
      if (logoutBtn) logoutBtn.hidden = false;
    }

    // Si estás en login/registro, podrías mandar a productos si ya hay sesión.
    const path = location.pathname.split('/').pop();
    if ((path === 'login.html' || path === 'registro.html') && getSessionUser()) {
      // opcional: no siempre, pero ayuda a la UX
      // Evitar redirect inmediato si usuario quiere ver el formulario.
    }
  }

  function ensureYear() {
    const y = $('#year');
    if (y) y.textContent = String(new Date().getFullYear());
  }

  function initLoginForm() {
    const form = $('#loginForm');
    if (!form) return;

    const logoutBtn = $('#logoutBtn');

    updateSessionUI();

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = normalizeEmail($('#loginEmail')?.value);
      const password = $('#loginPassword')?.value || '';

      const users = getUsers();
      const user = users.find((u) => normalizeEmail(u.email) === email && u.password === password);

      if (!user) {
        toast('Credenciales inválidas');
        return;
      }

      setSession(email);
      toast('Sesión iniciada ✅');
      // Ir a productos
      window.location.href = 'productos.html';
    });

    logoutBtn?.addEventListener('click', () => {
      clearSession();
      updateSessionUI();
      toast('Sesión cerrada');
      // no forzamos redirect para que el usuario vea login
      location.reload();
    });
  }

  function initRegisterForm() {
    const form = $('#registerForm');
    if (!form) return;

    updateSessionUI();

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = ($('#regName')?.value || '').trim();
      const email = normalizeEmail($('#regEmail')?.value);
      const password = $('#regPassword')?.value || '';
      const confirm = $('#regConfirm')?.value || '';

      if (!name || !email || !password) {
        toast('Completa todos los campos');
        return;
      }
      if (password !== confirm) {
        toast('Las contraseñas no coinciden');
        return;
      }

      const users = getUsers();
      const exists = users.some((u) => normalizeEmail(u.email) === email);
      if (exists) {
        toast('Este email ya está registrado');
        return;
      }

      // En un proyecto real se debe hashear la contraseña.
      users.push({ name, email, password });
      setUsers(users);

      // Iniciar sesión automáticamente
      setSession(email);
      toast('Cuenta creada ✅');
      window.location.href = 'productos.html';
    });
  }

  // -------------------- Contacto (email real) --------------------
  function initContactForm() {
    const form = $('#contactForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = ($('#name')?.value || '').trim();
      const email = ($('#email')?.value || '').trim();
      const message = ($('#message')?.value || '').trim();

      if (!name || !email || !message) {
        toast('Completa todos los campos');
        return;
      }

      try {
        toast('Enviando mensaje...');

        const resp = await fetch('http://localhost:3000/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message })
        });

        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          throw new Error(data?.error || 'Error enviando mensaje');
        }

        toast('Mensaje enviado ✅');
        form.reset();
      } catch (err) {
        console.error(err);
        toast(`No se pudo enviar: ${err?.message || err}`);
      }
    });
  }

  function initNavCartDefaultCount() {
    updateCartUI();
  }

  // -------------------- Init --------------------
  function init() {
    ensureYear();
    renderProductsIfNeeded();
    initCartInteractions();
    renderCartDrawerIfNeeded();
    initNavCartDefaultCount();

    // Sesión
    updateSessionUI();
    initLoginForm();
    initRegisterForm();

    // Contacto
    initContactForm();

    // Si estás en login/registro, refrescar información
    window.addEventListener('storage', () => {
      updateSessionUI();
      updateCartUI();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

