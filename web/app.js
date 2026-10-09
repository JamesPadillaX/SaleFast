// ============================================================
//  Sale Fast POS — Application Logic v2.0
//  API: http://localhost:8080/api
// ============================================================
const API = 'http://localhost:8080/api';

const state = {
  user: null, token: null,
  products: [], categories: [], proveedores: [],
  cart: [], paymentMethod: 'Efectivo',
  searchTerm: '', selectedCat: null,
  allProducts: []   // cache for table views
};

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value.trim();
    await handleLogin(u, p);
  });
  document.getElementById('pos-search').addEventListener('input', e => {
    state.searchTerm = e.target.value.toLowerCase();
    renderPosProducts();
  });
  document.getElementById('pos-search').addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const val = e.target.value.trim();
    const match = state.products.find(p =>
      p.codigoBarras === val || p.nombre.toLowerCase() === val.toLowerCase()
    );
    if (match) { addToCart(match); toast(`Escaneado: ${match.nombre}`, 'success'); e.target.value = ''; state.searchTerm = ''; renderPosProducts(); }
  });
  checkSession();
});

function initClock() {
  const el = document.getElementById('clock');
  const tick = () => el.textContent = new Date().toLocaleTimeString('es-PE', { hour12: false });
  tick(); setInterval(tick, 1000);
}

// ── Session ───────────────────────────────────────────────────
function checkSession() {
  const tk = localStorage.getItem('sfpos_token');
  const us = localStorage.getItem('sfpos_user');
  if (tk && us) {
    try { state.token = tk; state.user = JSON.parse(us); onLoginOk(); }
    catch { showAuth(); }
  } else { showAuth(); }
}
function showAuth()  { document.getElementById('auth-screen').classList.remove('hidden'); document.getElementById('app-layout').classList.add('hidden'); }
function hideAuth()  { document.getElementById('auth-screen').classList.add('hidden');    document.getElementById('app-layout').classList.remove('hidden'); }

window.fillLogin = (u, p) => {
  document.getElementById('login-username').value = u;
  document.getElementById('login-password').value = p;
};

async function handleLogin(username, password) {
  const errEl = document.getElementById('login-error');
  const errTxt = document.getElementById('login-error-text');
  const btn = document.getElementById('btn-login');
  errEl.classList.add('hidden');
  btn.disabled = true;
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Credenciales inválidas');
    state.token = data.token;
    state.user  = { id: data.id, nombre: data.nombre, username: data.username, rol: data.rol };
    localStorage.setItem('sfpos_token', state.token);
    localStorage.setItem('sfpos_user', JSON.stringify(state.user));
    onLoginOk();
    toast(`¡Bienvenido, ${state.user.nombre}!`, 'success');
  } catch (err) {
    errTxt.textContent = err.message;
    errEl.classList.remove('hidden');
  } finally { btn.disabled = false; }
}

function onLoginOk() {
  hideAuth();
  const initials = state.user.nombre.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();
  document.getElementById('user-avatar').textContent = initials;
  document.getElementById('user-name').textContent   = state.user.nombre;
  document.getElementById('user-role').textContent   = state.user.rol.replace('ROLE_','');
  loadBaseData();
}

window.logout = () => {
  state.token = state.user = null; state.cart = [];
  localStorage.removeItem('sfpos_token');
  localStorage.removeItem('sfpos_user');
  showAuth(); toast('Sesión cerrada', 'info');
};

// ── API Helper ────────────────────────────────────────────────
async function api(endpoint, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}), ...(opts.headers || {}) };
  const res = await fetch(`${API}${endpoint}`, { ...opts, headers });
  if (res.status === 401 || res.status === 403) { toast('Sin autorización', 'error'); throw new Error('Unauthorized'); }
  return res;
}

// ── Load base data ─────────────────────────────────────────────
async function loadBaseData() {
  await Promise.all([loadCategories(), loadProducts()]);
  gotoView('pos');
}

async function loadCategories() {
  try {
    const r = await api('/categorias');
    if (r.ok) state.categories = await r.json();
    renderCatBar();
  } catch {}
}

async function loadProducts() {
  try {
    const r = await api('/productos?size=200');
    if (r.ok) {
      const d = await r.json();
      state.products = d.content || d || [];
      state.allProducts = [...state.products];
      renderPosProducts();
      renderScannerPills();
    }
  } catch { toast('Error al cargar productos', 'error'); }
}

// ── Navigation ────────────────────────────────────────────────
const VIEW_TITLES = {
  pos: 'Punto de Venta', productos: 'Productos', categorias: 'Categorías',
  inventario: 'Inventario', ventas: 'Ventas', proveedores: 'Proveedores', usuarios: 'Usuarios'
};

window.gotoView = function(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`view-${id}`)?.classList.add('active');
  document.getElementById(`nav-${id}`)?.classList.add('active');
  document.getElementById('topbar-title').textContent = VIEW_TITLES[id] || id;
  if (id === 'productos') loadProductosTable();
  if (id === 'categorias') loadCategoriasTable();
  if (id === 'inventario') loadInventarioTable();
  if (id === 'ventas')    loadVentasTable();
  if (id === 'proveedores') loadProveedoresTable();
  if (id === 'usuarios')  loadUsuariosTable();
};

// ══════════════════════════════════════════════════════════════
//  POS VIEW
// ══════════════════════════════════════════════════════════════
function renderCatBar() {
  const bar = document.getElementById('cats-bar');
  bar.innerHTML = `<button class="cat-chip ${state.selectedCat===null?'active':''}" onclick="filterCat(null)">Todos</button>`;
  state.categories.forEach(c => {
    bar.innerHTML += `<button class="cat-chip ${state.selectedCat===c.id?'active':''}" onclick="filterCat(${c.id})">${esc(c.nombre)}</button>`;
  });
}

window.filterCat = id => { state.selectedCat = id; renderCatBar(); renderPosProducts(); };

function renderScannerPills() {
  const c = document.getElementById('scanner-pills');
  c.innerHTML = '';
  state.products.slice(0, 6).forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'scan-pill';
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5v14M8 5v14M12 5v14M17 5v14M21 5v14"/></svg>${esc(p.codigoBarras)}`;
    btn.onclick = () => { addToCart(p); toast(`Escaneado: ${p.nombre}`, 'info'); };
    c.appendChild(btn);
  });
}

function renderPosProducts() {
  const grid = document.getElementById('products-grid');
  const noMsg = document.getElementById('no-products');
  grid.innerHTML = '';
  let list = state.products.filter(p => p.activo !== false);
  if (state.selectedCat !== null) list = list.filter(p => p.categoria?.id === state.selectedCat);
  if (state.searchTerm) list = list.filter(p =>
    p.nombre.toLowerCase().includes(state.searchTerm) ||
    (p.codigoBarras && p.codigoBarras.includes(state.searchTerm))
  );
  noMsg.classList.toggle('hidden', list.length > 0);
  list.forEach(p => {
    const s = Number(p.stock);
    const sm = Number(p.stockMinimo);
    let dotCls = 'ok', dotTitle = `Stock: ${s}`;
    if (s <= 0) { dotCls = 'critical'; dotTitle = 'Sin stock'; }
    else if (s <= sm) { dotCls = 'critical'; dotTitle = `Crítico: ${s}`; }
    else if (s <= sm * 1.5) { dotCls = 'low'; dotTitle = `Bajo: ${s}`; }
    const card = document.createElement('div');
    card.className = `product-card${s <= 0 ? ' out-of-stock' : ''}`;
    card.innerHTML = `
      <div class="p-cat">${esc(p.categoria?.nombre || 'GENERAL')}</div>
      <div class="p-name">${esc(p.nombre)}</div>
      <div class="p-code">${esc(p.codigoBarras)}</div>
      <div class="p-footer">
        <div class="p-price">S/${Number(p.precioVenta).toFixed(2)} <span>/${p.unidadMedida||'und'}</span></div>
        <span class="stock-dot ${dotCls}" title="${dotTitle}"></span>
      </div>`;
    card.onclick = () => s > 0 && addToCart(p);
    grid.appendChild(card);
  });
}

// ── Cart ───────────────────────────────────────────────────────
window.addToCart = p => {
  if (Number(p.stock) <= 0) { toast(`Sin stock: ${p.nombre}`, 'error'); return; }
  const ex = state.cart.find(i => i.product.id === p.id);
  if (ex) {
    if (ex.qty >= Number(p.stock)) { toast('Stock máximo alcanzado', 'warning'); return; }
    ex.qty++; ex.sub = ex.qty * Number(p.precioVenta);
  } else {
    state.cart.push({ product: p, qty: 1, sub: Number(p.precioVenta) });
  }
  renderCart();
};

window.updateQty = (id, d) => {
  const item = state.cart.find(i => i.product.id === id);
  if (!item) return;
  const nq = item.qty + d;
  if (nq <= 0) { removeFromCart(id); return; }
  if (nq > Number(item.product.stock)) { toast('Stock insuficiente', 'warning'); return; }
  item.qty = nq; item.sub = nq * Number(item.product.precioVenta);
  renderCart();
};

window.removeFromCart = id => { state.cart = state.cart.filter(i => i.product.id !== id); renderCart(); };
window.clearCart = () => { state.cart = []; renderCart(); };

function renderCart() {
  const list = document.getElementById('cart-list');
  const emptyEl = document.getElementById('cart-empty');
  const badge = document.getElementById('cart-badge');
  const btn = document.getElementById('btn-checkout');
  const total = state.cart.reduce((a, i) => a + i.qty, 0);
  badge.textContent = total;
  if (state.cart.length === 0) {
    list.innerHTML = '';
    list.appendChild(emptyEl);
    emptyEl.style.display = '';
    ['s-subtotal','s-igv','s-total'].forEach(id => document.getElementById(id).textContent = 'S/ 0.00');
    btn.disabled = true; return;
  }
  emptyEl.style.display = 'none';
  list.innerHTML = '';
  let gross = 0;
  state.cart.forEach(item => {
    gross += item.sub;
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${esc(item.product.nombre)}</div>
        <div class="cart-item-unit">S/${Number(item.product.precioVenta).toFixed(2)} / ${item.product.unidadMedida||'und'}</div>
      </div>
      <div class="qty-control">
        <button class="qty-btn" onclick="updateQty(${item.product.id},-1)">−</button>
        <span class="qty-val">${item.qty}</span>
        <button class="qty-btn" onclick="updateQty(${item.product.id},1)">+</button>
      </div>
      <div class="cart-item-price">S/${item.sub.toFixed(2)}</div>
      <button class="btn-icon-only danger" onclick="removeFromCart(${item.product.id})">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>`;
    list.appendChild(row);
  });
  const net = gross / 1.18, igv = gross - net;
  document.getElementById('s-subtotal').textContent = `S/ ${net.toFixed(2)}`;
  document.getElementById('s-igv').textContent = `S/ ${igv.toFixed(2)}`;
  document.getElementById('s-total').textContent = `S/ ${gross.toFixed(2)}`;
  btn.disabled = false;
}

window.selectPayMethod = btn => {
  state.paymentMethod = btn.dataset.m;
  document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.toggle('active', b === btn));
};

// ── Process Sale ───────────────────────────────────────────────
window.processSale = async () => {
  if (!state.cart.length) return;
  const btn = document.getElementById('btn-checkout');
  btn.disabled = true;
  const clientDni = document.getElementById('client-dni').value.trim();
  const clientName = document.getElementById('client-name').value.trim();
  const gross = state.cart.reduce((a,i) => a+i.sub, 0);
  const net = gross/1.18, igv = gross - net;
  const payload = {
    subtotal: net, igv, total: gross,
    metodoPago: state.paymentMethod,
    cliente: clientDni ? { dni: clientDni, nombre: clientName || `Cliente DNI ${clientDni}` } : null,
    detalles: state.cart.map(i => ({
      producto: { id: i.product.id },
      cantidad: i.qty,
      precioUnitario: i.product.precioVenta,
      subtotal: i.sub
    }))
  };
  try {
    const r = await api('/ventas', { method: 'POST', body: JSON.stringify(payload) });
    if (!r.ok) { const e = await r.json().catch(()=>({})); throw new Error(e.message || 'Error al registrar'); }
    const sale = await r.json();
    openReceipt(sale, payload);
    toast('¡Venta realizada con éxito!', 'success');
    state.cart = []; renderCart();
    document.getElementById('client-dni').value = '';
    document.getElementById('client-name').value = '';
    await loadProducts();
  } catch(err) { toast(err.message, 'error'); }
  finally { btn.disabled = state.cart.length === 0; }
};

function openReceipt(sale, pl) {
  const now = new Date();
  document.getElementById('r-num').textContent = `B001-${String(sale.id||1).padStart(8,'0')}`;
  document.getElementById('r-date').textContent = now.toLocaleString('es-PE');
  document.getElementById('r-cashier').textContent = state.user.nombre;
  document.getElementById('r-client').textContent = pl.cliente?.nombre || 'Público General';
  const items = document.getElementById('r-items');
  items.innerHTML = '';
  state.cart.forEach(i => {
    items.innerHTML += `<div class="r-row"><span>${i.qty}x ${esc(i.product.nombre)}</span><span>S/ ${i.sub.toFixed(2)}</span></div>`;
  });
  document.getElementById('r-subtotal').textContent = `S/ ${pl.subtotal.toFixed(2)}`;
  document.getElementById('r-igv').textContent = `S/ ${pl.igv.toFixed(2)}`;
  document.getElementById('r-total').textContent = `S/ ${pl.total.toFixed(2)}`;
  document.getElementById('r-method').textContent = state.paymentMethod;
  openModal('modal-receipt');
}

// ══════════════════════════════════════════════════════════════
//  PRODUCTOS TABLE
// ══════════════════════════════════════════════════════════════
window.loadProductosTable = async () => {
  const tbody = document.getElementById('productos-tbody');
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted)">Cargando…</td></tr>';
  try {
    const r = await api('/productos?size=200');
    const d = await r.json();
    state.allProducts = d.content || d || [];
    renderProductosTable(state.allProducts);
  } catch { toast('Error al cargar productos', 'error'); }
};

function renderProductosTable(list) {
  const tbody = document.getElementById('productos-tbody');
  if (!list.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted)">Sin productos registrados</td></tr>'; return; }
  tbody.innerHTML = list.map(p => {
    const s = Number(p.stock), sm = Number(p.stockMinimo);
    let badge = 'badge-success', label = 'Normal';
    if (s <= 0) { badge = 'badge-danger'; label = 'Sin stock'; }
    else if (s <= sm) { badge = 'badge-danger'; label = 'Crítico'; }
    else if (s <= sm*1.5) { badge = 'badge-warning'; label = 'Bajo'; }
    
    // Check local subcat assignment if any
    const subcat = localStorage.getItem(`sfpos_prod_subcat_${p.id}`) || '';

    return `<tr>
      <td><code>${esc(p.codigoBarras)}</code></td>
      <td>
        <strong>${esc(p.nombre)}</strong>
        ${subcat ? `<br><span class="subcat-tag">${esc(subcat)}</span>` : ''}
      </td>
      <td><span class="badge badge-neutral">${esc(p.categoria?.nombre||'—')}</span></td>
      <td>S/ ${Number(p.precioCompra).toFixed(2)}</td>
      <td>S/ ${Number(p.precioVenta).toFixed(2)}</td>
      <td><strong>${s}</strong> ${p.unidadMedida||'und'}</td>
      <td><span class="badge ${badge}">${label}</span></td>
      <td>
        <div style="display:flex;gap:4px;">
          <button class="btn-icon-only edit" title="Editar Producto" onclick="editProducto(${p.id})">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon-only" title="Historial del Precio Inicial" style="color:var(--primary)" onclick="showPriceHistorial(${p.id}, '${esc(p.nombre)}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </button>
          <button class="btn-icon-only" title="Ver y Descargar Código QR" onclick="showQR(${p.id}, '${esc(p.nombre)}', '${esc(p.codigoBarras)}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </button>
          <button class="btn-icon-only" title="Historial de Movimientos de Inventario" onclick="showInvHistorial(${p.id}, '${esc(p.nombre)}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </button>
          <button class="btn-icon-only danger" title="Eliminar Producto" onclick="confirmDelete('producto', ${p.id}, '${esc(p.nombre)}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

window.filterProductosTable = q => {
  const lq = q.toLowerCase();
  const filtered = state.allProducts.filter(p =>
    p.nombre.toLowerCase().includes(lq) || p.codigoBarras.includes(lq)
  );
  renderProductosTable(filtered);
};

window.onProdCategoryChange = () => {
  const catId = document.getElementById('prod-categoria').value;
  const selSub = document.getElementById('prod-subcategoria');
  selSub.innerHTML = '<option value="">(Sin subcategoría)</option>';
  if (!catId) return;
  const savedSub = localStorage.getItem(`sfpos_subcats_${catId}`);
  if (savedSub) {
    try {
      const arr = JSON.parse(savedSub);
      arr.forEach(s => {
        selSub.innerHTML += `<option value="${esc(s)}">${esc(s)}</option>`;
      });
    } catch {}
  }
};

window.openProductoModal = () => {
  document.getElementById('modal-producto-title').textContent = 'Nuevo Producto';
  document.getElementById('prod-id').value = '';
  ['prod-codigo','prod-nombre','prod-descripcion'].forEach(id => document.getElementById(id).value = '');
  ['prod-precio-compra','prod-precio-venta','prod-stock','prod-stock-min'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('prod-unidad').value = 'unidad';
  // populate categories
  const sel = document.getElementById('prod-categoria');
  sel.innerHTML = state.categories.map(c => `<option value="${c.id}">${esc(c.nombre)}</option>`).join('');
  onProdCategoryChange();
  openModal('modal-producto');
};

window.editProducto = async id => {
  const p = state.allProducts.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modal-producto-title').textContent = 'Editar Producto';
  document.getElementById('prod-id').value = p.id;
  document.getElementById('prod-codigo').value = p.codigoBarras;
  document.getElementById('prod-nombre').value = p.nombre;
  document.getElementById('prod-descripcion').value = p.descripcion || '';
  document.getElementById('prod-precio-compra').value = p.precioCompra;
  document.getElementById('prod-precio-venta').value = p.precioVenta;
  document.getElementById('prod-stock').value = p.stock;
  document.getElementById('prod-stock-min').value = p.stockMinimo;
  document.getElementById('prod-unidad').value = p.unidadMedida || 'unidad';
  const sel = document.getElementById('prod-categoria');
  sel.innerHTML = state.categories.map(c => `<option value="${c.id}" ${c.id === p.categoria?.id ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('');
  onProdCategoryChange();
  const savedSub = localStorage.getItem(`sfpos_prod_subcat_${p.id}`);
  if (savedSub) document.getElementById('prod-subcategoria').value = savedSub;
  openModal('modal-producto');
};

window.saveProducto = async () => {
  const id = document.getElementById('prod-id').value;
  const catId = parseInt(document.getElementById('prod-categoria').value);
  const subcatVal = document.getElementById('prod-subcategoria').value;
  const pCompra = parseFloat(document.getElementById('prod-precio-compra').value);
  const pVenta = parseFloat(document.getElementById('prod-precio-venta').value);

  const body = {
    codigoBarras: document.getElementById('prod-codigo').value.trim(),
    nombre: document.getElementById('prod-nombre').value.trim(),
    descripcion: document.getElementById('prod-descripcion').value.trim(),
    precioCompra: pCompra,
    precioVenta: pVenta,
    stock: parseFloat(document.getElementById('prod-stock').value) || 0,
    stockMinimo: parseFloat(document.getElementById('prod-stock-min').value) || 0,
    unidadMedida: document.getElementById('prod-unidad').value,
    categoria: { id: catId },
    activo: true
  };
  if (!body.codigoBarras || !body.nombre || !catId || isNaN(pVenta)) { toast('Completa los campos obligatorios', 'warning'); return; }
  try {
    const existing = id ? state.allProducts.find(x => x.id === parseInt(id)) : null;
    const r = id
      ? await api(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(body) })
      : await api('/productos', { method: 'POST', body: JSON.stringify(body) });
    if (!r.ok) throw new Error('Error al guardar producto');
    const savedProd = await r.json();
    const prodId = savedProd.id || (id ? parseInt(id) : null);

    if (prodId) {
      if (subcatVal) localStorage.setItem(`sfpos_prod_subcat_${prodId}`, subcatVal);
      else localStorage.removeItem(`sfpos_prod_subcat_${prodId}`);

      // Track Price History
      recordPriceChange(prodId, existing, pCompra, pVenta);
    }

    closeModal('modal-producto');
    toast(id ? 'Producto actualizado' : 'Producto creado', 'success');
    await loadProducts();
    loadProductosTable();
  } catch(err) { toast(err.message, 'error'); }
};

// ── Price History Logic ────────────────────────────────────────
function getPriceHistory(prodId, currentProd) {
  const key = `sfpos_price_hist_${prodId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try { return JSON.parse(stored); } catch {}
  }
  // Initialize with initial price from current product
  const pCompra = currentProd ? Number(currentProd.precioCompra) : 0;
  const pVenta = currentProd ? Number(currentProd.precioVenta) : 0;
  const margen = pVenta > 0 ? (((pVenta - pCompra)/pVenta)*100).toFixed(1) : 0;
  const initialData = {
    compraInicial: pCompra,
    ventaInicial: pVenta,
    fechaInicial: currentProd?.fechaCreacion || new Date().toISOString(),
    historial: [
      {
        fecha: currentProd?.fechaCreacion || new Date().toISOString(),
        tipo: 'PRECIO INICIAL REGISTRADO',
        pCompra: pCompra,
        precioAnterior: 0,
        precioNuevo: pVenta,
        variacion: 'S/ 0.00',
        margen: `${margen}%`,
        usuario: 'Registro Inicial'
      }
    ]
  };
  localStorage.setItem(key, JSON.stringify(initialData));
  return initialData;
}

function recordPriceChange(prodId, oldProd, newCompra, newVenta) {
  const data = getPriceHistory(prodId, oldProd);
  if (!oldProd) return; // already recorded on initial creation
  const oldVenta = Number(oldProd.precioVenta);
  const oldCompra = Number(oldProd.precioCompra);

  if (oldVenta !== newVenta || oldCompra !== newCompra) {
    const diff = newVenta - oldVenta;
    const diffSign = diff >= 0 ? `+S/ ${diff.toFixed(2)}` : `-S/ ${Math.abs(diff).toFixed(2)}`;
    const margen = newVenta > 0 ? (((newVenta - newCompra)/newVenta)*100).toFixed(1) : 0;
    data.historial.unshift({
      fecha: new Date().toISOString(),
      tipo: oldVenta !== newVenta ? 'CAMBIO DE PRECIO VENTA' : 'AJUSTE COSTO COMPRA',
      pCompra: newCompra,
      precioAnterior: oldVenta,
      precioNuevo: newVenta,
      variacion: diffSign,
      margen: `${margen}%`,
      usuario: state.user?.nombre || 'Administrador'
    });
    localStorage.setItem(`sfpos_price_hist_${prodId}`, JSON.stringify(data));
  }
}

window.showPriceHistorial = (prodId, name) => {
  const p = state.allProducts.find(x => x.id === prodId);
  const data = getPriceHistory(prodId, p);
  document.getElementById('modal-precio-title').textContent = `Historial de Precios — ${name}`;

  const cIni = Number(data.compraInicial || 0);
  const vIni = Number(data.ventaInicial || 0);
  const mIni = vIni > 0 ? (((vIni - cIni)/vIni)*100).toFixed(1) : '0.0';

  const cAct = p ? Number(p.precioCompra) : cIni;
  const vAct = p ? Number(p.precioVenta) : vIni;
  const mAct = vAct > 0 ? (((vAct - cAct)/vAct)*100).toFixed(1) : '0.0';

  document.getElementById('pm-compra-ini').textContent = `S/ ${cIni.toFixed(2)}`;
  document.getElementById('pm-venta-ini').textContent = `S/ ${vIni.toFixed(2)}`;
  document.getElementById('pm-margen-ini').textContent = `${mIni}%`;

  document.getElementById('pm-venta-act').textContent = `S/ ${vAct.toFixed(2)}`;
  document.getElementById('pm-margen-act').textContent = `${mAct}%`;

  const tbody = document.getElementById('precio-historial-tbody');
  tbody.innerHTML = data.historial.map(h => {
    const dStr = new Date(h.fecha).toLocaleString('es-PE');
    const isUp = h.variacion && h.variacion.startsWith('+');
    const isDown = h.variacion && h.variacion.startsWith('-');
    const color = isUp ? 'var(--success)' : isDown ? 'var(--danger)' : 'var(--text-secondary)';
    return `<tr>
      <td>${dStr}</td>
      <td><span class="badge ${h.tipo.includes('INICIAL')?'badge-purple':'badge-primary'}">${esc(h.tipo)}</span></td>
      <td>${h.precioAnterior ? `S/ ${Number(h.precioAnterior).toFixed(2)}` : '—'}</td>
      <td><strong>S/ ${Number(h.precioNuevo).toFixed(2)}</strong></td>
      <td style="color:${color};font-weight:700;">${h.variacion}</td>
      <td><span class="badge badge-success">${h.margen}</span></td>
      <td>${esc(h.usuario)}</td>
    </tr>`;
  }).join('');

  openModal('modal-precio-historial');
};

// ── QR ─────────────────────────────────────────────────────────
let currentQrCode = '';
window.showQR = (id, name, code) => {
  currentQrCode = code;
  document.getElementById('modal-qr-title').textContent = `QR — ${name}`;
  document.getElementById('qr-product-name').textContent = name;
  document.getElementById('qr-product-code').textContent = code;
  const canvas = document.getElementById('qr-canvas');
  canvas.innerHTML = '';
  new QRCode(canvas, {
    text: code,
    width: 200, height: 200,
    colorDark: '#0F172A', colorLight: '#FFFFFF',
    correctLevel: QRCode.CorrectLevel.H
  });
  openModal('modal-qr');
};

window.downloadQR = () => {
  const canvas = document.querySelector('#qr-canvas canvas') || document.querySelector('#qr-canvas img');
  if (!canvas) { toast('QR no disponible para descarga', 'error'); return; }
  const a = document.createElement('a');
  a.href = canvas.src || canvas.toDataURL('image/png');
  a.download = `QR_${currentQrCode || 'producto'}.png`;
  a.click();
  toast('Código QR descargado', 'success');
};

window.printQR = () => window.print();


// ── Inventory History ──────────────────────────────────────────
window.showInvHistorial = async (id, name) => {
  document.getElementById('modal-inv-title').textContent = `Historial — ${name}`;
  const content = document.getElementById('inv-timeline-content');
  content.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)">Cargando…</div>';
  openModal('modal-inv-historial');
  try {
    const r = await api(`/inventario/historial/producto/${id}`);
    const list = await r.json();
    if (!list.length) { content.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)">Sin movimientos registrados</div>'; return; }
    const TIPO_ICON = {
      ENTRADA: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`,
      SALIDA:  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`,
      AJUSTE:  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
    };
    content.innerHTML = list.map(m => {
      const tipo = (m.tipo||'AJUSTE').toUpperCase();
      const cls = tipo === 'ENTRADA' ? 'in' : tipo === 'SALIDA' ? 'out' : 'adj';
      const fecha = m.fecha ? new Date(m.fecha).toLocaleString('es-PE') : '—';
      return `<div class="inv-event">
        <div class="inv-dot ${cls}">${TIPO_ICON[tipo]||TIPO_ICON.AJUSTE}</div>
        <div class="inv-info">
          <div class="inv-tipo">${tipo}</div>
          <div class="inv-qty">Cantidad: <strong>${m.cantidad}</strong></div>
          <div class="inv-meta">${fecha} · ${m.usuario?.nombre||'Sistema'}</div>
          ${m.motivo ? `<div class="inv-meta">Motivo: ${esc(m.motivo)}</div>` : ''}
        </div>
      </div>`;
    }).join('');
  } catch { content.innerHTML = '<div style="text-align:center;color:var(--danger);padding:20px">Error al cargar historial</div>'; }
};

// ── Movimiento Inventario ──────────────────────────────────────
window.openMovimientoModal = () => {
  const sel = document.getElementById('mov-producto');
  sel.innerHTML = state.allProducts.map(p => `<option value="${p.id}">${esc(p.nombre)}</option>`).join('');
  document.getElementById('mov-cantidad').value = '';
  document.getElementById('mov-motivo').value = '';
  openModal('modal-movimiento');
};

window.saveMovimiento = async () => {
  const body = {
    productoId: parseInt(document.getElementById('mov-producto').value),
    tipo: document.getElementById('mov-tipo').value,
    cantidad: parseFloat(document.getElementById('mov-cantidad').value),
    motivo: document.getElementById('mov-motivo').value.trim()
  };
  if (!body.cantidad || body.cantidad <= 0) { toast('Ingresa una cantidad válida', 'warning'); return; }
  try {
    const r = await api('/inventario/movimiento', { method: 'POST', body: JSON.stringify(body) });
    if (!r.ok) throw new Error('Error al registrar movimiento');
    closeModal('modal-movimiento');
    toast('Movimiento registrado', 'success');
    await loadProducts();
    loadInventarioTable();
  } catch(err) { toast(err.message, 'error'); }
};

// ══════════════════════════════════════════════════════════════
//  CATEGORÍAS TABLE & SUBCATEGORÍAS
// ══════════════════════════════════════════════════════════════
window.loadCategoriasTable = async () => {
  const tbody = document.getElementById('categorias-tbody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted)">Cargando…</td></tr>';
  try {
    const r = await api('/categorias');
    state.categories = await r.json();
    tbody.innerHTML = state.categories.map(c => {
      const savedSub = localStorage.getItem(`sfpos_subcats_${c.id}`);
      let subcatsHtml = '<span style="color:var(--text-muted);font-size:0.75rem;">—</span>';
      if (savedSub) {
        try {
          const arr = JSON.parse(savedSub);
          if (arr.length) {
            subcatsHtml = arr.map(s => `<span class="subcat-tag">${esc(s)}</span>`).join('');
          }
        } catch {}
      }
      return `<tr>
        <td>#${c.id}</td>
        <td><strong>${esc(c.nombre)}</strong></td>
        <td>${subcatsHtml}</td>
        <td>${esc(c.descripcion||'—')}</td>
        <td>${c.fechaCreacion ? new Date(c.fechaCreacion).toLocaleDateString('es-PE') : '—'}</td>
        <td>
          <div style="display:flex;gap:4px;">
            <button class="btn-icon-only edit" title="Editar Categoría" onclick="editCategoria(${c.id})">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon-only danger" title="Eliminar Categoría" onclick="confirmDelete('categoria', ${c.id}, '${esc(c.nombre)}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');
  } catch { toast('Error al cargar categorías', 'error'); }
};

window.openCatModal = () => {
  document.getElementById('modal-cat-title').textContent = 'Nueva Categoría';
  document.getElementById('cat-id').value = '';
  document.getElementById('cat-nombre').value = '';
  document.getElementById('cat-subcategorias').value = '';
  document.getElementById('cat-descripcion').value = '';
  openModal('modal-categoria');
};

window.editCategoria = id => {
  const c = state.categories.find(x => x.id === id);
  if (!c) return;
  document.getElementById('modal-cat-title').textContent = 'Editar Categoría';
  document.getElementById('cat-id').value = c.id;
  document.getElementById('cat-nombre').value = c.nombre;
  document.getElementById('cat-descripcion').value = c.descripcion || '';
  const savedSub = localStorage.getItem(`sfpos_subcats_${c.id}`);
  if (savedSub) {
    try {
      const arr = JSON.parse(savedSub);
      document.getElementById('cat-subcategorias').value = arr.join(', ');
    } catch { document.getElementById('cat-subcategorias').value = ''; }
  } else {
    document.getElementById('cat-subcategorias').value = '';
  }
  openModal('modal-categoria');
};

window.saveCategoria = async () => {
  const id = document.getElementById('cat-id').value;
  const subcatsRaw = document.getElementById('cat-subcategorias').value.trim();
  const body = {
    nombre: document.getElementById('cat-nombre').value.trim(),
    descripcion: document.getElementById('cat-descripcion').value.trim()
  };
  if (!body.nombre) { toast('El nombre es obligatorio', 'warning'); return; }
  try {
    const r = id
      ? await api(`/categorias/${id}`, { method: 'PUT', body: JSON.stringify(body) })
      : await api('/categorias', { method: 'POST', body: JSON.stringify(body) });
    if (!r.ok) throw new Error('Error al guardar categoría');
    const saved = await r.json();
    const catId = saved.id || (id ? parseInt(id) : null);

    if (catId) {
      const subcatsArr = subcatsRaw
        ? subcatsRaw.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      if (subcatsArr.length) {
        localStorage.setItem(`sfpos_subcats_${catId}`, JSON.stringify(subcatsArr));
      } else {
        localStorage.removeItem(`sfpos_subcats_${catId}`);
      }
    }

    closeModal('modal-categoria');
    toast(id ? 'Categoría actualizada' : 'Categoría creada', 'success');
    await loadCategories();
    loadCategoriasTable();
  } catch(err) { toast(err.message, 'error'); }
};

// ══════════════════════════════════════════════════════════════
//  USUARIOS CRUD
// ══════════════════════════════════════════════════════════════
let cachedUsuarios = [];

window.loadUsuariosTable = async () => {
  const tbody = document.getElementById('usuarios-tbody');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted)">Cargando…</td></tr>';
  try {
    const r = await api('/usuarios');
    if (!r.ok) throw new Error();
    cachedUsuarios = await r.json();
    tbody.innerHTML = cachedUsuarios.map(u => {
      const isAdmin = u.rol?.nombre?.includes('ADMIN');
      return `<tr>
        <td>#${u.id}</td>
        <td><strong>${esc(u.nombre)}</strong></td>
        <td><code>${esc(u.username)}</code></td>
        <td><span class="badge ${isAdmin?'badge-purple':'badge-primary'}">${esc(u.rol?.nombre||'—')}</span></td>
        <td><span class="badge ${u.activo?'badge-success':'badge-danger'}">${u.activo?'Activo':'Inactivo'}</span></td>
        <td>${u.fechaCreacion ? new Date(u.fechaCreacion).toLocaleDateString('es-PE') : '—'}</td>
        <td>
          <div style="display:flex;gap:4px;">
            <button class="btn-icon-only edit" title="Editar Usuario" onclick="editUsuario(${u.id})">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-icon-only danger" title="Desactivar Usuario" onclick="confirmDelete('usuario', ${u.id}, '${esc(u.nombre)}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');
  } catch { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted)">Solo admins pueden ver usuarios</td></tr>'; }
};

window.openUsuarioModal = () => {
  document.getElementById('modal-user-title').textContent = 'Nuevo Usuario';
  document.getElementById('user-id').value = '';
  document.getElementById('user-nombre').value = '';
  document.getElementById('user-username').value = '';
  document.getElementById('user-password').value = '';
  document.getElementById('user-password').placeholder = 'Contraseña de acceso';
  document.getElementById('user-pw-hint').textContent = '(mínimo 6 caracteres)';
  document.getElementById('user-rol').value = '2';
  document.getElementById('user-activo-group').style.display = 'none';
  openModal('modal-usuario');
};

window.editUsuario = id => {
  const u = cachedUsuarios.find(x => x.id === id);
  if (!u) return;
  document.getElementById('modal-user-title').textContent = 'Editar Usuario';
  document.getElementById('user-id').value = u.id;
  document.getElementById('user-nombre').value = u.nombre;
  document.getElementById('user-username').value = u.username;
  document.getElementById('user-password').value = '';
  document.getElementById('user-password').placeholder = '•••••••• (dejar en blanco para no cambiar)';
  document.getElementById('user-pw-hint').textContent = '(opcional si no se cambia)';
  document.getElementById('user-rol').value = u.rol?.id || (u.rol?.nombre?.includes('ADMIN') ? '1' : '2');
  document.getElementById('user-activo').value = u.activo ? 'true' : 'false';
  document.getElementById('user-activo-group').style.display = 'block';
  openModal('modal-usuario');
};

window.saveUsuario = async () => {
  const id = document.getElementById('user-id').value;
  const nombre = document.getElementById('user-nombre').value.trim();
  const username = document.getElementById('user-username').value.trim();
  const password = document.getElementById('user-password').value;
  const rolId = parseInt(document.getElementById('user-rol').value);
  const activo = document.getElementById('user-activo').value === 'true';

  if (!nombre || !username) { toast('Nombre y usuario son obligatorios', 'warning'); return; }
  if (!id && !password) { toast('La contraseña es obligatoria para nuevos usuarios', 'warning'); return; }

  const body = { nombre, username, rolId, activo };
  if (password) body.password = password;

  try {
    const r = id
      ? await api(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(body) })
      : await api('/usuarios', { method: 'POST', body: JSON.stringify(body) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Error al guardar usuario');
    closeModal('modal-usuario');
    toast(id ? 'Usuario actualizado' : 'Usuario creado con éxito', 'success');
    loadUsuariosTable();
  } catch(err) { toast(err.message, 'error'); }
};

// ══════════════════════════════════════════════════════════════
//  CONFIRM DELETE
// ══════════════════════════════════════════════════════════════
window.confirmDelete = (type, id, name) => {
  document.getElementById('confirm-msg').textContent = `¿Eliminar "${name}"? Esta acción no se puede deshacer.`;
  const btn = document.getElementById('confirm-ok-btn');
  btn.onclick = async () => {
    try {
      let endpoint = '';
      if (type === 'producto')   endpoint = `/productos/${id}`;
      if (type === 'categoria')  endpoint = `/categorias/${id}`;
      if (type === 'proveedor')  endpoint = `/proveedores/${id}`;
      if (type === 'usuario')    endpoint = `/usuarios/${id}`;
      const r = await api(endpoint, { method: 'DELETE' });
      if (!r.ok && r.status !== 204) throw new Error('Error al procesar la solicitud');
      closeModal('modal-confirm');
      toast(`"${name}" procesado`, 'success');
      if (type === 'producto') { await loadProducts(); loadProductosTable(); }
      if (type === 'categoria') { await loadCategories(); loadCategoriasTable(); }
      if (type === 'proveedor') loadProveedoresTable();
      if (type === 'usuario') loadUsuariosTable();
    } catch(err) { toast(err.message, 'error'); }
  };
  openModal('modal-confirm');
};

// ══════════════════════════════════════════════════════════════
//  INVENTARIO TABLE
// ══════════════════════════════════════════════════════════════
window.loadInventarioTable = async () => {
  const tbody = document.getElementById('inventario-tbody');
  tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--text-muted)">Cargando…</td></tr>';
  try {
    const r = await api('/productos?size=200');
    const d = await r.json();
    const list = d.content || d || [];
    tbody.innerHTML = list.map(p => {
      const s = Number(p.stock), sm = Number(p.stockMinimo);
      let badge = 'badge-success', label = 'Normal';
      if (s <= 0) { badge = 'badge-danger'; label = 'Sin stock'; }
      else if (s <= sm) { badge = 'badge-danger'; label = 'Crítico'; }
      else if (s <= sm*1.5) { badge = 'badge-warning'; label = 'Bajo'; }
      return `<tr>
        <td><code>${esc(p.codigoBarras)}</code></td>
        <td><strong>${esc(p.nombre)}</strong></td>
        <td>${esc(p.categoria?.nombre||'—')}</td>
        <td>S/ ${Number(p.precioCompra).toFixed(2)}</td>
        <td>S/ ${Number(p.precioVenta).toFixed(2)}</td>
        <td><strong style="color:${s<=sm?'var(--danger)':s<=sm*1.5?'var(--warning)':'var(--success)'}">${s}</strong> ${p.unidadMedida||'und'}</td>
        <td>${sm}</td>
        <td><span class="badge ${badge}">${label}</span></td>
        <td>
          <button class="btn-icon-only" title="Ver historial" onclick="showInvHistorial(${p.id}, '${esc(p.nombre)}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </button>
        </td>
      </tr>`;
    }).join('');
  } catch { toast('Error al cargar inventario', 'error'); }
};

// ══════════════════════════════════════════════════════════════
//  VENTAS TABLE
// ══════════════════════════════════════════════════════════════
window.loadVentasTable = async () => {
  const tbody = document.getElementById('ventas-tbody');
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted)">Cargando…</td></tr>';
  try {
    const r = await api('/ventas');
    const list = (await r.json()).reverse();
    if (!list.length) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted)">Sin ventas registradas</td></tr>'; return; }
    tbody.innerHTML = list.map(s => `<tr>
      <td><strong>B001-${String(s.id).padStart(8,'0')}</strong></td>
      <td>${s.fecha ? new Date(s.fecha).toLocaleString('es-PE') : '—'}</td>
      <td>${esc(s.usuario?.nombre||'Admin')}</td>
      <td>${esc(s.cliente?.nombre||'Público General')}</td>
      <td><span class="badge badge-primary">${s.metodoPago||'Efectivo'}</span></td>
      <td>S/ ${Number(s.subtotal).toFixed(2)}</td>
      <td>S/ ${Number(s.igv).toFixed(2)}</td>
      <td><strong>S/ ${Number(s.total).toFixed(2)}</strong></td>
    </tr>`).join('');
  } catch { toast('Error al cargar ventas', 'error'); }
};

// ══════════════════════════════════════════════════════════════
//  PROVEEDORES TABLE
// ══════════════════════════════════════════════════════════════
window.loadProveedoresTable = async () => {
  const tbody = document.getElementById('proveedores-tbody');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted)">Cargando…</td></tr>';
  try {
    const r = await api('/proveedores');
    state.proveedores = await r.json();
    tbody.innerHTML = state.proveedores.map(p => `<tr>
      <td>#${p.id}</td>
      <td><strong>${esc(p.nombre)}</strong></td>
      <td><code>${esc(p.ruc)}</code></td>
      <td>${esc(p.telefono||'—')}</td>
      <td>${esc(p.correo||'—')}</td>
      <td>${esc(p.direccion||'—')}</td>
      <td>
        <div style="display:flex;gap:4px;">
          <button class="btn-icon-only edit" onclick="editProveedor(${p.id})">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon-only danger" onclick="confirmDelete('proveedor', ${p.id}, '${esc(p.nombre)}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join('');
  } catch { toast('Error al cargar proveedores', 'error'); }
};

window.openProveedorModal = () => {
  document.getElementById('modal-prov-title').textContent = 'Nuevo Proveedor';
  document.getElementById('prov-id').value = '';
  ['prov-nombre','prov-ruc','prov-telefono','prov-correo','prov-direccion'].forEach(id => document.getElementById(id).value = '');
  openModal('modal-proveedor');
};

window.editProveedor = id => {
  const p = state.proveedores.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modal-prov-title').textContent = 'Editar Proveedor';
  document.getElementById('prov-id').value = p.id;
  document.getElementById('prov-nombre').value = p.nombre;
  document.getElementById('prov-ruc').value = p.ruc;
  document.getElementById('prov-telefono').value = p.telefono || '';
  document.getElementById('prov-correo').value = p.correo || '';
  document.getElementById('prov-direccion').value = p.direccion || '';
  openModal('modal-proveedor');
};

window.saveProveedor = async () => {
  const id = document.getElementById('prov-id').value;
  const body = {
    nombre: document.getElementById('prov-nombre').value.trim(),
    ruc: document.getElementById('prov-ruc').value.trim(),
    telefono: document.getElementById('prov-telefono').value.trim(),
    correo: document.getElementById('prov-correo').value.trim(),
    direccion: document.getElementById('prov-direccion').value.trim()
  };
  if (!body.nombre || !body.ruc) { toast('Nombre y RUC son obligatorios', 'warning'); return; }
  try {
    const r = id
      ? await api(`/proveedores/${id}`, { method: 'PUT', body: JSON.stringify(body) })
      : await api('/proveedores', { method: 'POST', body: JSON.stringify(body) });
    if (!r.ok) throw new Error('Error al guardar proveedor');
    closeModal('modal-proveedor');
    toast(id ? 'Proveedor actualizado' : 'Proveedor creado', 'success');
    loadProveedoresTable();
  } catch(err) { toast(err.message, 'error'); }
};

// ══════════════════════════════════════════════════════════════
//  USUARIOS TABLE (read-only, no endpoint for CRUD in backend)
// ══════════════════════════════════════════════════════════════
window.loadUsuariosTable = async () => {
  const tbody = document.getElementById('usuarios-tbody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted)">Cargando…</td></tr>';
  try {
    const r = await api('/usuarios');
    if (!r.ok) throw new Error();
    const list = await r.json();
    tbody.innerHTML = list.map(u => `<tr>
      <td>#${u.id}</td>
      <td><strong>${esc(u.nombre)}</strong></td>
      <td><code>${esc(u.username)}</code></td>
      <td><span class="badge ${u.rol?.nombre?.includes('ADMIN')?'badge-purple':'badge-primary'}">${esc(u.rol?.nombre||'—')}</span></td>
      <td><span class="badge ${u.activo?'badge-success':'badge-danger'}">${u.activo?'Activo':'Inactivo'}</span></td>
      <td>${u.fechaCreacion ? new Date(u.fechaCreacion).toLocaleDateString('es-PE') : '—'}</td>
    </tr>`).join('');
  } catch { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted)">Solo admins pueden ver usuarios</td></tr>'; }
};

// ══════════════════════════════════════════════════════════════
//  CONFIRM DELETE
// ══════════════════════════════════════════════════════════════
window.confirmDelete = (type, id, name) => {
  document.getElementById('confirm-msg').textContent = `¿Eliminar "${name}"? Esta acción no se puede deshacer.`;
  const btn = document.getElementById('confirm-ok-btn');
  btn.onclick = async () => {
    try {
      let endpoint = '';
      if (type === 'producto')   endpoint = `/productos/${id}`;
      if (type === 'categoria')  endpoint = `/categorias/${id}`;
      if (type === 'proveedor')  endpoint = `/proveedores/${id}`;
      const r = await api(endpoint, { method: 'DELETE' });
      if (!r.ok && r.status !== 204) throw new Error('Error al eliminar');
      closeModal('modal-confirm');
      toast(`"${name}" eliminado`, 'success');
      if (type === 'producto') { await loadProducts(); loadProductosTable(); }
      if (type === 'categoria') { await loadCategories(); loadCategoriasTable(); }
      if (type === 'proveedor') loadProveedoresTable();
    } catch(err) { toast(err.message, 'error'); }
  };
  openModal('modal-confirm');
};

// ══════════════════════════════════════════════════════════════
//  MODALS
// ══════════════════════════════════════════════════════════════
window.openModal = id => document.getElementById(id).classList.add('active');
window.closeModal = id => document.getElementById(id).classList.remove('active');
// Close on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('active'); });
});

// ══════════════════════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════════════════════
const TOAST_ICONS = {
  success: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  error:   `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info:    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
};

function toast(msg, type = 'info') {
  const stack = document.getElementById('toast-stack');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${TOAST_ICONS[type]||TOAST_ICONS.info}<span class="toast-text">${esc(msg)}</span>`;
  stack.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(30px)'; setTimeout(() => el.remove(), 300); }, 3500);
}

// ── Utils ──────────────────────────────────────────────────────
function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
