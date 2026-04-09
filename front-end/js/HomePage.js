const products = [
  {id:1,name:'Hoa Hồng Đỏ Premium',cat:'hoa-tuoi',price:250000,salePrice:null,emoji:'🌹',label:'Nổi bật',rating:4.8,reviews:24},
  {id:2,name:'Bó Hoa Sinh Nhật Pastel',cat:'bo-hoa',price:450000,salePrice:380000,emoji:'💐',label:'SALE',rating:4.9,reviews:56},
  {id:3,name:'Giỏ Hoa Khai Trương',cat:'gio-hoa',price:850000,salePrice:null,emoji:'🧺',label:'Nổi bật',rating:4.7,reviews:32},
  {id:4,name:'Hộp Hoa Lụa Infinity Rose',cat:'hoa-lua',price:680000,salePrice:580000,emoji:'🌸',label:'SALE',rating:4.9,reviews:87},
];

function fmt(value){
  return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
}

function renderFeatured(){
  const grid = document.getElementById('featuredGrid');
  if(!grid) return;
  grid.innerHTML = products.map(p => `
      <article class="product-card">
        <div class="product-img">
          ${p.label ? `<span class="product-badge ${p.salePrice ? 'sale' : ''}">${p.label}</span>` : ''}
          <span>${p.emoji}</span>
        </div>
        <div class="product-info">
          <div class="product-cat">${p.cat.replace('hoa-tuoi','Hoa tươi').replace('bo-hoa','Bó hoa').replace('gio-hoa','Giỏ hoa').replace('hoa-lua','Hoa lụa')}</div>
          <div class="product-name">${p.name}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
            <div>
              <div class="product-price">${fmt(p.salePrice || p.price)}</div>
              ${p.salePrice ? `<div class="product-price-old">${fmt(p.price)}</div>` : ''}
            </div>
            <div style="text-align:right">
              <div class="product-stars">${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5 - Math.round(p.rating))}</div>
              <div style="font-size:12px;color:var(--gray-400)">(${p.reviews})</div>
            </div>
          </div>
        </div>
      </article>`).join('');
}

document.addEventListener('DOMContentLoaded', renderFeatured);
