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
      img: 'https://scontent.fuio1-1.fna.fbcdn.net/v/t39.30808-6/691637846_1472763651212096_2898476646348698606_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=13d280&_nc_ohc=P1IG8STwe3wQ7kNvwHpEFmj&_nc_oc=AdrZjjoD8pC6p0OzeBxfQm_e-LdZYsPknyxCF--9DO_kuRb3jwzPLPWnEtvDtkQewLQOhE2-5NSJquG8GUxo39XD&_nc_zt=23&_nc_ht=scontent.fuio1-1.fna&_nc_gid=LBN50_n8Uq1xOx-2V_uQ_g&_nc_ss=7b2a8&oh=00_Af7Czq7c7mTzpMoBVIRk0NkUhbGewHz6fH6SPcZM4Z4XhQ&oe=6A03827D'
    },
    {
      id: 'flor-2',
      name: 'Flor de Loto Radiante',
      price: 14,
      desc: 'Una delicada flor de loto creada con limpiapipas, símbolo de paz y armonía, ideal para decorar espacios con un toque elegante y espiritual.',
      img: 'https://scontent.fuio1-2.fna.fbcdn.net/v/t39.30808-6/690631605_1472777377877390_5890356805991306700_n.jpg?stp=dst-jpg_p526x296_tt6&_nc_cat=105&ccb=1-7&_nc_sid=13d280&_nc_ohc=rNtab6C0EsEQ7kNvwESMPUq&_nc_oc=Adr2z9KKleMXt0Wg0LZTeBERtiqOPG_F0kghsvqwZ61J0B3M-ZwnpnulxU4JYz049MOSZ1_NW5d5JxBKiQnMecwp&_nc_zt=23&_nc_ht=scontent.fuio1-2.fna&_nc_gid=q0vlHjKh07_whTYCqncKzg&_nc_ss=7b2a8&oh=00_Af7BYQ7Xn8ZYIM9555XHjIa55KTB7mj_pLu7hNwj5tqbVg&oe=6A0378C5'
    },
    {
      id: 'fig-1',
      name: 'Flor Abstracta Corazón',
      price: 15,
      desc: 'Una composición original de limpiapipas con formas naturales y tonos cálidos. Su diseño único invita a la imaginación y puede interpretarse como un corazón, una flor abstracta o un detalle artístico.',
      img: 'https://scontent.fuio1-1.fna.fbcdn.net/v/t39.30808-6/694144435_1472782917876836_4743779552545219961_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=13d280&_nc_ohc=AOe87LYslUkQ7kNvwGnas-b&_nc_oc=Adr0najOnzd7KhcmAn0H3HBUkw7VHto6ZEROKhwGGBoLjayU8dNqwj7Z_FCGezx17Y257Qz6ReDyYd6LOJJiRCTX&_nc_zt=23&_nc_ht=scontent.fuio1-1.fna&_nc_gid=ZFfwusX1fsJ66v-imRMWeA&_nc_ss=7b2a8&oh=00_Af4dAVYLIz9nyB56XJW17fKlg60yWZG0KWapOp3BWJerEQ&oe=6A038C19'
    },
    {
      id: 'fig-2',
      name: 'Totoro Encantado',
      price: 12,
      desc: 'Figura inspirada en el personaje Totoro del anime Mi Vecino Totoro. Hecho con limpiapipas grises y detalles artesanales, transmite ternura y conexión con la naturaleza.',
      img: 'https://scontent.fuio1-2.fna.fbcdn.net/v/t39.30808-6/691714522_1472797994541995_2165362398500141164_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=13d280&_nc_ohc=r3Fxy7GeAPcQ7kNvwHXQRG1&_nc_oc=AdrWUF9pGbvBFkERtJ9al9PJzm4T2qezNiPPYQK0WHz7HaiAv0c8sbO-xbhrRKvprWJSDYzkNYWQccAMlmFlJM8_&_nc_zt=23&_nc_ht=scontent.fuio1-2.fna&_nc_gid=fPVhE7NhSc7zK-6_jZXBbQ&_nc_ss=7b2a8&oh=00_Af6utW4XgIybpBob2zmO5i8bj0TpRpVdHCWaNrXbubULdQ&oe=6A037350'
    },
    {
      id: 'flor-3',
      name: 'Ratoncito Minimalista',
      price: 12,
      desc: 'Un simpático ratoncito gris con orejas grandes, elaborado con limpiapipas. Su diseño sencillo y expresivo lo convierte en una pieza adorable y divertida.',
      img: 'https://scontent.fuio1-2.fna.fbcdn.net/v/t39.30808-6/694645274_1472798741208587_6066079945099997867_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=13d280&_nc_ohc=4W6o1CUtx5MQ7kNvwF86SdT&_nc_oc=Ado2WtNosyNRuE7xSUT0lYZ9EuNtfyKNGJrQaZWPEJK2Q0r4Fc5Nhl-ddKwMamm3kW-qToYY-UBQRzAbUKDcT0m2&_nc_zt=23&_nc_ht=scontent.fuio1-2.fna&_nc_gid=pGASrA0xVPLxpFmaR24UNw&_nc_ss=7b2a8&oh=00_Af6_03KDy72nuPYy_otvmGkipDG0MHM2BWJ_jE0ULcFJUA&oe=6A038FC8'
    },
    {
      id: 'fig-3',
      name: 'Pollito Divertido',
      price: 8,
      desc: 'Pequeño pollito de color amarillo con detalles en naranja, hecho con limpiapipas. Representa inocencia y alegría, ideal como figura decorativa o regalo.',
      img: 'https://scontent.fuio1-2.fna.fbcdn.net/v/t39.30808-6/694207397_1472797201208741_5215103069637359757_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=13d280&_nc_ohc=WE_E52ReZMIQ7kNvwHfuC5v&_nc_oc=AdrPbxf7Uw693MgVsVeTdy02_ghC7oJ0n531cZAQHnELke1ez8JDIvq_Zdn8eGLr_--NahHTTn5uaMjrxC6SZV7c&_nc_zt=23&_nc_ht=scontent.fuio1-2.fna&_nc_gid=-tXeIDAP4JcXrotG3yDmxQ&_nc_ss=7b2a8&oh=00_Af5n9CJpihz9mwSMBaKW4SB-UlPgkk6EUeQeSfz8Za1Lig&oe=6A037C3C'
    },


    // Nuevos productos (total 9)
    {
      id: 'flor-4',
      name: 'Llavero de Medusa Azulada',
      price: 3,
      desc: 'Figura colgante azul con forma de medusa o flor marina, hecha con limpiapipas y detalles colgantes que simulan pétalos o tentáculos. Su estilo es fresco, divertido y artesanal, ideal para quienes aman los diseños únicos.',
      img: 'https://scontent.fuio1-1.fna.fbcdn.net/v/t39.30808-6/693630568_1472804524541342_1825968148552657812_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=13d280&_nc_ohc=8VdhzyXsWbMQ7kNvwGJ_4ei&_nc_oc=AdoAqlA0B3_OfUQfPLJVwpWcNeCYMpBld1eR1RcEmjGWX52DNnWy9Gu6lPvixPgmgXA3G0ETy9UhEHZjpMBQi3rD&_nc_zt=23&_nc_ht=scontent.fuio1-1.fna&_nc_gid=lISp5kVWolrcyV8TVMgDwg&_nc_ss=7b2a8&oh=00_Af4vsrlknMVHh5cq85-cTqR1FIHk84EmA876sfEfUxT-DQ&oe=6A039652'
    },
    {
      id: 'fig-4',
      name: 'Llavero de Fresa Jugosa',
      price: 3,
      desc: 'Dos pequeñas fresas rojas unidas por tallos verdes, elaboradas con limpiapipas. Su aspecto fresco y colorido transmite alegría y encanto natural, perfecto como accesorio decorativo o regalo artesanal.',
      img: 'https://scontent.fuio1-1.fna.fbcdn.net/v/t39.30808-6/693575475_1472804594541335_8085640367950017377_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=13d280&_nc_ohc=HTYAKuLus90Q7kNvwEQIy1w&_nc_oc=AdqHKByH57Ft476DewFPepmub-c0Sz08hjNcP00aUCgDNDkR8RUbrlb6sgy-EfgL_ebYqXbUH5-nQLp0o10XATSv&_nc_zt=23&_nc_ht=scontent.fuio1-1.fna&_nc_gid=FzuPvb2YOUADL0yOTp4Pyw&_nc_ss=7b2a8&oh=00_Af6bezeWndyKosJQ90XF-UxeiI7Baa_HWHUI0BnDlX8uXQ&oe=6A03A59F'
    },
    {
      id: 'flor-5',
      name: 'Llavero Susuwatari (Espíritu de Hollín)',
      price: 3,
      desc: 'Pequeño llavero hecho con limpiapipas negros y ojos grandes, que recrea a los simpáticos espíritus de hollín del anime japonés. Su diseño tierno y misterioso lo convierte en un accesorio único para fans del estilo Ghibli o amantes de lo artesanal.',
      img: 'https://scontent.fuio1-2.fna.fbcdn.net/v/t39.30808-6/691217798_1472804691207992_8358897349312961641_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=13d280&_nc_ohc=eVYKQAcK61YQ7kNvwFPm6zb&_nc_oc=AdrIY1ORG_gAv607tRKDVhAChLLY-3xpoRfT--soP2dsfbBaWjIFcXTTO7UFPKI5tVRez4Dza0AX5LWNWefiaQ70&_nc_zt=23&_nc_ht=scontent.fuio1-2.fna&_nc_gid=_MJo7l5eS-GDlxUfk5ABzw&_nc_ss=7b2a8&oh=00_Af4LRRd3CfBDzHzRxIBafTpQEIqKX5KeZcDxowFEjlwp8A&oe=6A039E09'
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

    checkoutBtn?.addEventListener('click', () => {
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
      toast('¡Pedido finalizado (demo)! 🎉');
      // En demo, vaciamos carrito
      localStorage.removeItem(STORAGE_CART_KEY);
      updateCartUI();
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

  // -------------------- Contacto (demo) --------------------
  function initContactForm() {
    const form = $('#contactForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      toast('Mensaje enviado (demo) 💌');
      form.reset();
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

