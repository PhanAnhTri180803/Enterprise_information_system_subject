/* ═══════════════════════════════════════════════════════════════
   admin.js — Quản trị: dashboard, sản phẩm, đơn hàng,
              khách hàng, mã giảm giá, tồn kho, đánh giá, báo cáo
═══════════════════════════════════════════════════════════════ */

/* ─── STATE ─── */
let editingProductId = null; // null = thêm mới, number = sửa

/* ══════════════════════════════════
   NAVIGATION ADMIN
══════════════════════════════════ */
function switchAdmin(panel, btn) {
  // Ẩn tất cả panels
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.admin-menu-item').forEach(b => b.classList.remove('active'));

  // Hiện panel được chọn
  const target = document.getElementById('admin-' + panel);
  if (target) target.classList.add('active');
  if (btn)    btn.classList.add('active');

  // Render nội dung
  const renderers = {
    dashboard: renderAdminDashboard,
    products:  renderAdminProducts,
    orders:    renderAdminOrders,
    users:     renderAdminUsers,
    coupons:   renderAdminCoupons,
    inventory: renderInventory,
    reviews:   renderAdminReviews,
    reports:   renderReports,
  };
  if (renderers[panel]) renderers[panel]();
}

/* ══════════════════════════════════
   DASHBOARD
══════════════════════════════════ */
function renderAdminDashboard() {
  // Đơn chờ xử lý
  const pending = orders.filter(o => o.status === 'pending').length;
  const el = document.getElementById('pendingCount');
  if (el) el.textContent = pending;

  // Biểu đồ doanh thu 7 ngày
  renderRevenueChart();

  // Bảng đơn hàng mới nhất
  const recent = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  renderTable('recentOrdersTable',
    ['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái', 'Ngày đặt'],
    recent.map(o => {
      const st = ORDER_STATUS[o.status] || { label: o.status, color: '#999' };
      return [
        `<strong>${o.id}</strong>`,
        o.customerName,
        `<strong style="color:var(--pink-500)">${formatPrice(o.total)}</strong>`,
        `<span class="status-badge" style="background:${st.color}20;color:${st.color}">${st.label}</span>`,
        o.createdAt,
      ];
    })
  );
}

function renderRevenueChart() {
  const chartEl  = document.getElementById('revenueChart');
  const labelsEl = document.getElementById('chartLabels');
  if (!chartEl) return;

  const max = Math.max(...REVENUE_7DAYS.map(d => d.value));

  chartEl.innerHTML = REVENUE_7DAYS.map(d => `
    <div class="chart-bar-wrap" title="${d.day}: ${d.value}K">
      <div class="chart-bar" style="height:${Math.round(d.value / max * 100)}%"></div>
    </div>`).join('');

  if (labelsEl) {
    labelsEl.innerHTML = REVENUE_7DAYS.map(d =>
      `<span class="chart-label">${d.day}</span>`).join('');
  }
}

/* ══════════════════════════════════
   QUẢN LÝ SẢN PHẨM
══════════════════════════════════ */
function renderAdminProducts() {
  const search = (document.getElementById('adminSearch')?.value || '').toLowerCase();
  const cat    =  document.getElementById('adminCatFilter')?.value || '';

  const list = products.filter(p =>
    (!cat  || p.category === cat) &&
    (!search || p.name.toLowerCase().includes(search))
  );

  renderTable('adminProductsTable',
    ['ID', 'Sản phẩm', 'Danh mục', 'Giá', 'Tồn kho', 'Đã bán', 'Thao tác'],
    list.map(p => [
      p.id,
      `<span style="font-size:20px">${p.emoji}</span> <strong>${p.name}</strong>`,
      catLabel(p.category),
      formatPrice(effectivePrice(p)),
      `<span style="color:${p.stock < 5 ? 'var(--pink-500)' : 'inherit'}">${p.stock}</span>`,
      p.sold,
      `<button class="btn btn-outline btn-xs" onclick="openProductModal(${p.id})">Sửa</button>
       <button class="btn btn-xs" style="background:#FEE2E2;color:#DC2626;border:none"
               onclick="deleteProduct(${p.id})">Xóa</button>`,
    ])
  );
}

/* ─── Modal sản phẩm ─── */
function openProductModal(productId = null) {
  editingProductId = productId;

  const title = document.getElementById('productModalTitle');
  if (title) title.textContent = productId ? 'Sửa sản phẩm' : 'Thêm sản phẩm';

  // Reset form
  ['pName','pDesc','pEmoji'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  ['pPrice','pSalePrice','pStock'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const featured = document.getElementById('pFeatured');
  if (featured) featured.checked = false;

  // Điền dữ liệu nếu đang sửa
  if (productId) {
    const p = products.find(p => p.id === productId);
    if (p) {
      document.getElementById('pName').value      = p.name;
      document.getElementById('pCat').value       = p.category;
      document.getElementById('pPrice').value     = p.price;
      document.getElementById('pSalePrice').value = p.salePrice || '';
      document.getElementById('pStock').value     = p.stock;
      document.getElementById('pEmoji').value     = p.emoji;
      document.getElementById('pDesc').value      = p.desc;
      document.getElementById('pFeatured').checked = p.featured;
    }
  }

  openModal('productModal');
}

function saveProduct() {
  const name      = document.getElementById('pName').value.trim();
  const category  = document.getElementById('pCat').value;
  const price     = parseInt(document.getElementById('pPrice').value);
  const salePrice = parseInt(document.getElementById('pSalePrice').value) || null;
  const stock     = parseInt(document.getElementById('pStock').value);
  const emoji     = document.getElementById('pEmoji').value.trim() || '🌸';
  const desc      = document.getElementById('pDesc').value.trim();
  const featured  = document.getElementById('pFeatured').checked;

  if (!name || isNaN(price) || isNaN(stock)) {
    showToast('⚠️ Vui lòng điền đầy đủ thông tin bắt buộc!');
    return;
  }

  if (editingProductId) {
    // Cập nhật
    const p = products.find(p => p.id === editingProductId);
    if (p) Object.assign(p, { name, category, price, salePrice, stock, emoji, desc, featured });
    showToast('✅ Đã cập nhật sản phẩm!');
  } else {
    // Thêm mới
    products.push({
      id:       products.length ? Math.max(...products.map(p => p.id)) + 1 : 1,
      name, category, price, salePrice, stock, emoji, desc, featured,
      sold:    0,
      reviews: [],
    });
    showToast('✅ Đã thêm sản phẩm mới!');
  }

  closeModal('productModal');
  renderAdminProducts();
}

function deleteProduct(productId) {
  if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
  products = products.filter(p => p.id !== productId);
  renderAdminProducts();
  showToast('🗑️ Đã xóa sản phẩm!');
}

/* ══════════════════════════════════
   QUẢN LÝ ĐƠN HÀNG
══════════════════════════════════ */
function renderAdminOrders() {
  const statusFilter = document.getElementById('orderStatusFilter')?.value || '';
  const list = orders.filter(o => !statusFilter || o.status === statusFilter);
  const sorted = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  renderTable('adminOrdersTable',
    ['Mã đơn', 'Khách hàng', 'SĐT', 'Tổng tiền', 'Thanh toán', 'Trạng thái', 'Thao tác'],
    sorted.map(o => {
      const st = ORDER_STATUS[o.status] || { label: o.status, color: '#999' };
      return [
        `<strong>${o.id}</strong>`,
        o.customerName,
        o.phone,
        `<strong style="color:var(--pink-500)">${formatPrice(o.total)}</strong>`,
        paymentLabel(o.payment),
        `<select class="form-input" style="padding:4px 8px;font-size:12px;max-width:160px"
                 onchange="updateOrderStatus('${o.id}',this.value)">
          ${Object.entries(ORDER_STATUS).map(([k, v]) =>
            `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v.label}</option>`
          ).join('')}
         </select>`,
        `<button class="btn btn-outline btn-xs" onclick="showOrderDetail('${o.id}')">Xem</button>`,
      ];
    })
  );
}

function updateOrderStatus(orderId, newStatus) {
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = newStatus;
    showToast(`✅ Đã cập nhật trạng thái đơn ${orderId}`);
    renderAdminDashboard(); // cập nhật số đơn pending
  }
}

function showOrderDetail(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  const st = ORDER_STATUS[order.status] || { label: order.status, color: '#999' };
  document.getElementById('orderModalTitle').textContent = `Chi tiết đơn hàng — ${order.id}`;
  document.getElementById('orderModalContent').innerHTML = `
    <div class="order-detail">
      <div class="order-detail__row"><span>Khách hàng</span><strong>${order.customerName}</strong></div>
      <div class="order-detail__row"><span>Số điện thoại</span>${order.phone}</div>
      <div class="order-detail__row"><span>Địa chỉ</span>${order.address}</div>
      <div class="order-detail__row"><span>Giao hàng</span>${order.deliveryDate} — ${order.deliverySlot}</div>
      ${order.note ? `<div class="order-detail__row"><span>Ghi chú</span>${order.note}</div>` : ''}
      <div class="order-detail__row"><span>Thanh toán</span>${paymentLabel(order.payment)}</div>
      <div class="order-detail__row">
        <span>Trạng thái</span>
        <span class="status-badge" style="background:${st.color}20;color:${st.color}">${st.label}</span>
      </div>
      <hr style="margin:16px 0;border-color:var(--gray-100)">
      ${order.items.map(i => `
        <div class="order-detail__row">
          <span>${i.emoji || '🌸'} ${i.name} × ${i.qty}</span>
          <span>${formatPrice(i.price * i.qty)}</span>
        </div>`).join('')}
      <hr style="margin:16px 0;border-color:var(--gray-100)">
      <div class="order-detail__row"><span>Tạm tính</span>${formatPrice(order.subtotal)}</div>
      ${order.discount > 0 ? `<div class="order-detail__row"><span style="color:var(--green-500)">Giảm giá</span><span style="color:var(--green-500)">−${formatPrice(order.discount)}</span></div>` : ''}
      <div class="order-detail__row"><span>Phí ship</span>${formatPrice(order.shipping)}</div>
      <div class="order-detail__row" style="font-weight:700">
        <span>Tổng cộng</span>
        <span style="color:var(--pink-500)">${formatPrice(order.total)}</span>
      </div>
    </div>`;

  openModal('orderModal');
}

/* ══════════════════════════════════
   QUẢN LÝ KHÁCH HÀNG
══════════════════════════════════ */
function renderAdminUsers() {
  renderTable('adminUsersTable',
    ['ID', 'Họ tên', 'Email', 'Số điện thoại', 'Vai trò', 'Ngày tạo'],
    users.map(u => [
      u.id,
      u.name,
      u.email,
      u.phone || '—',
      u.role === 'admin'
        ? '<span class="status-badge" style="background:#FEE2E2;color:#DC2626">Admin</span>'
        : '<span class="status-badge" style="background:#DCFCE7;color:#16A34A">User</span>',
      u.createdAt,
    ])
  );
}

/* ══════════════════════════════════
   MÃ GIẢM GIÁ
══════════════════════════════════ */
function renderAdminCoupons() {
  renderTable('adminCouponsTable',
    ['Mã code', 'Loại', 'Giá trị', 'Đơn tối thiểu', 'Sử dụng', 'Hết hạn', 'Trạng thái', 'Thao tác'],
    coupons.map(c => {
      const expired = new Date(c.expiry) < new Date();
      const active  = c.active && !expired && c.usedCount < c.maxUses;
      return [
        `<strong>${c.code}</strong>`,
        c.type === 'percent' ? 'Phần trăm' : 'Cố định',
        c.type === 'percent' ? `${c.value}%` : formatPrice(c.value),
        formatPrice(c.minOrder),
        `${c.usedCount} / ${c.maxUses}`,
        c.expiry,
        active
          ? '<span class="status-badge" style="background:#DCFCE7;color:#16A34A">Hoạt động</span>'
          : '<span class="status-badge" style="background:#F3F4F6;color:#6B7280">Hết hạn</span>',
        `<button class="btn btn-xs" style="background:#FEE2E2;color:#DC2626;border:none"
                 onclick="deleteCoupon('${c.code}')">Xóa</button>`,
      ];
    })
  );
}

function openCouponModal() {
  ['couponCode','couponValue','couponMin','couponMax'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('couponExpiry').value = '';
  openModal('couponModal');
}

function saveCoupon() {
  const code   = document.getElementById('couponCode').value.trim().toUpperCase();
  const type   = document.getElementById('couponType').value;
  const value  = parseInt(document.getElementById('couponValue').value);
  const min    = parseInt(document.getElementById('couponMin').value)  || 0;
  const max    = parseInt(document.getElementById('couponMax').value)  || 999;
  const expiry = document.getElementById('couponExpiry').value;

  if (!code || isNaN(value) || !expiry) {
    showToast('⚠️ Vui lòng điền đủ thông tin bắt buộc!');
    return;
  }
  if (coupons.find(c => c.code === code)) {
    showToast('⚠️ Mã code đã tồn tại!');
    return;
  }

  coupons.push({ code, type, value, minOrder: min, maxUses: max, usedCount: 0, expiry, active: true });
  closeModal('couponModal');
  renderAdminCoupons();
  showToast(`✅ Đã tạo mã "${code}"!`);
}

function deleteCoupon(code) {
  if (!confirm(`Xóa mã "${code}"?`)) return;
  const idx = coupons.findIndex(c => c.code === code);
  if (idx !== -1) coupons.splice(idx, 1);
  renderAdminCoupons();
  showToast('🗑️ Đã xóa mã giảm giá!');
}

/* ══════════════════════════════════
   TỒN KHO
══════════════════════════════════ */
function renderInventory() {
  const lowStock = products.filter(p => p.stock < 5);
  const alertEl  = document.getElementById('lowStockAlert');
  if (alertEl) {
    alertEl.textContent = lowStock.length > 0
      ? `${lowStock.length} sản phẩm sắp hết hàng: ${lowStock.map(p => p.name).join(', ')}`
      : 'Tồn kho ổn định, không có sản phẩm nào sắp hết hàng.';
  }

  renderTable('inventoryTable',
    ['Sản phẩm', 'Danh mục', 'Tồn kho', 'Đã bán', 'Trạng thái', 'Thao tác'],
    products.map(p => {
      const status = p.stock === 0 ? ['Hết hàng', '#EF4444']
                   : p.stock < 5  ? ['Sắp hết',  '#F59E0B']
                                   : ['Còn hàng', '#10B981'];
      return [
        `<span style="font-size:18px">${p.emoji}</span> ${p.name}`,
        catLabel(p.category),
        `<strong>${p.stock}</strong>`,
        p.sold,
        `<span class="status-badge" style="background:${status[1]}20;color:${status[1]}">${status[0]}</span>`,
        `<div style="display:flex;gap:6px;align-items:center">
           <button class="btn btn-xs btn-outline" onclick="adjustStock(${p.id}, -1)">−</button>
           <button class="btn btn-xs btn-outline" onclick="adjustStock(${p.id}, +10)">+10</button>
         </div>`,
      ];
    })
  );
}

function adjustStock(productId, delta) {
  const p = products.find(p => p.id === productId);
  if (!p) return;
  p.stock = Math.max(0, p.stock + delta);
  renderInventory();
}

/* ══════════════════════════════════
   ĐÁNH GIÁ
══════════════════════════════════ */
function renderAdminReviews() {
  const allReviews = [];
  products.forEach(p => {
    p.reviews.forEach(r => {
      allReviews.push({ ...r, productName: p.name, productId: p.id });
    });
  });

  if (allReviews.length === 0) {
    document.getElementById('adminReviewsTable').innerHTML =
      '<tr><td colspan="5" style="text-align:center;color:var(--gray-400);padding:24px">Chưa có đánh giá nào.</td></tr>';
    return;
  }

  renderTable('adminReviewsTable',
    ['Sản phẩm', 'Khách hàng', 'Sao', 'Nội dung', 'Ngày', 'Thao tác'],
    allReviews.map((r, idx) => [
      r.productName,
      r.user,
      `${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}`,
      r.text,
      r.date,
      `<button class="btn btn-xs" style="background:#FEE2E2;color:#DC2626;border:none"
               onclick="deleteReview(${r.productId},${idx})">Xóa</button>`,
    ])
  );
}

function deleteReview(productId, reviewIndex) {
  if (!confirm('Xóa đánh giá này?')) return;
  const p = products.find(p => p.id === productId);
  if (p) p.reviews.splice(reviewIndex, 1);
  renderAdminReviews();
  showToast('🗑️ Đã xóa đánh giá!');
}

/* ══════════════════════════════════
   BÁO CÁO
══════════════════════════════════ */
function renderReports() {
  // Top sản phẩm bán chạy
  const top = [...products].sort((a, b) => b.sold - a.sold).slice(0, 5);
  renderTable('topProductsTable',
    ['#', 'Sản phẩm', 'Danh mục', 'Đã bán', 'Doanh thu ước tính'],
    top.map((p, i) => [
      `<strong>${i + 1}</strong>`,
      `${p.emoji} ${p.name}`,
      catLabel(p.category),
      `<strong>${p.sold}</strong>`,
      `<strong style="color:var(--pink-500)">${formatPrice(effectivePrice(p) * p.sold)}</strong>`,
    ])
  );

  // Biểu đồ phân bố theo danh mục
  const chartEl = document.getElementById('catChart');
  if (chartEl) {
    const maxVal = Math.max(...REVENUE_BY_CAT.map(c => c.value));
    chartEl.innerHTML = REVENUE_BY_CAT.map(c => `
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;min-width:60px">
        <span style="font-size:11px;font-weight:600;color:var(--gray-600)">${c.value}%</span>
        <div style="width:100%;background:${c.color};border-radius:6px 6px 0 0;height:${Math.round(c.value / maxVal * 100)}px;transition:.3s"></div>
        <span style="font-size:11px;color:var(--gray-500);text-align:center">${c.label}</span>
      </div>`).join('');
  }
}

/* ══════════════════════════════════
   MODAL HELPERS
══════════════════════════════════ */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

/* ══════════════════════════════════
   RENDER TABLE HELPER
   Tái sử dụng để render mọi bảng trong admin
══════════════════════════════════ */
function renderTable(tableId, headers, rows) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const thead = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
  const tbody = rows.length
    ? `<tbody>${rows.map(row =>
        `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
      ).join('')}</tbody>`
    : `<tbody><tr><td colspan="${headers.length}" style="text-align:center;color:var(--gray-400);padding:24px">Không có dữ liệu.</td></tr></tbody>`;

  table.innerHTML = thead + tbody;
}

/* ══════════════════════════════════
   HELPERS (dùng chung với main.js / products.js)
   Khai báo lại để tránh phụ thuộc thứ tự load
══════════════════════════════════ */
function paymentLabel(method) {
  const map = {
    cod:     '💵 COD',
    bank:    '🏦 Chuyển khoản',
    momo:    '💜 MoMo',
    zalopay: '💙 ZaloPay',
    vnpay:   '🔴 VNPay',
  };
  return map[method] || method;
}