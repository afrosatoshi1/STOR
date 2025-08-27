// script.js - handles auth, product listing, cart actions, navbar toggles
async function getMe(){
  const r = await fetch('/api/me', { credentials: 'include' });
  const data = await r.json();
  return data.user;
}

function renderNav(user){
  const nav = document.getElementById('navActions');
  if(!nav) return;
  nav.innerHTML = '';
  if(user){
    const welcome = document.createElement('span'); welcome.textContent = user.username; nav.appendChild(welcome);
    const logoutBtn = document.createElement('button'); logoutBtn.className='btn'; logoutBtn.textContent='Logout'; logoutBtn.onclick = async ()=>{ await fetch('/api/logout', { method:'POST', credentials:'include' }); location.reload(); }; nav.appendChild(logoutBtn);
    if(user.role==='admin'){ const adminBtn=document.createElement('button'); adminBtn.className='btn'; adminBtn.textContent='Admin'; adminBtn.onclick=()=> location.href='/admin'; nav.appendChild(adminBtn); }
  }else{
    const login = document.createElement('button'); login.className='btn'; login.textContent='Login'; login.onclick=()=> openModal('loginModal'); nav.appendChild(login);
    const reg = document.createElement('button'); reg.className='btn'; reg.textContent='Register'; reg.onclick=()=> openModal('registerModal'); nav.appendChild(reg);
  }
  const cartBtn = document.createElement('button'); cartBtn.className='btn'; cartBtn.textContent='Cart'; cartBtn.onclick=()=> location.href='/cart'; nav.appendChild(cartBtn);
}

async function loadProducts(){
  const res = await fetch('/api/products', { credentials: 'include' });
  if(!res.ok && res.status===403){
    // not admin, but still try to fetch public products endpoint? API requires admin in this design.
    // For convenience, if 403, show empty or message.
    console.warn('Admin-only product API. No public products available in this build.');
    document.querySelector('.product-grid').innerHTML = '<p style="padding:18px;">No products available. Admin must add products.</p>';
    return;
  }
  const products = await res.json();
  const grid = document.querySelector('.product-grid');
  grid.innerHTML='';
  products.forEach(p=>{
    const card = document.createElement('div'); card.className='product-card';
    card.innerHTML = `<img src="${p.image||''}" style="width:100%;height:140px;object-fit:cover"/><h4>${p.name}</h4><p>₦${p.price}</p><button class="btn" onclick="addToCart(${p.id}, '${p.name}', ${p.price})">Add to cart</button>`;
    grid.appendChild(card);
  });
}

function addToCart(id, name, price){
  const cart = JSON.parse(localStorage.getItem('cart')||'[]');
  const item = cart.find(c=>c.id===id);
  if(item) item.qty = (item.qty||1)+1; else cart.push({ id, name, price, qty:1 });
  localStorage.setItem('cart', JSON.stringify(cart));
  alert('Added to cart');
}

// modals
function openModal(id){ document.getElementById(id).style.display='flex'; }
function closeModal(id){ document.getElementById(id).style.display='none'; }

// forms
document.getElementById('registerForm')?.addEventListener('submit', async e=>{
  e.preventDefault();
  const fd = new FormData(e.target); const body = { username: fd.get('username'), password: fd.get('password') };
  const res = await fetch('/api/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body), credentials:'include' });
  if(res.ok){ alert('Registered and logged in'); closeModal('registerModal'); location.reload(); } else { alert('Register failed'); }
});
document.getElementById('loginForm')?.addEventListener('submit', async e=>{
  e.preventDefault();
  const fd = new FormData(e.target); const body = { username: fd.get('username'), password: fd.get('password') };
  const res = await fetch('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body), credentials:'include' });
  if(res.ok){ alert('Logged in'); closeModal('loginModal'); location.reload(); } else { alert('Login failed'); }
});

// init
document.addEventListener('DOMContentLoaded', async ()=>{
  document.getElementById('year').textContent = new Date().getFullYear();
  const user = await getMe();
  renderNav(user);
  loadProducts();
});
