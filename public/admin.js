async function fetchAdminProducts() {
  const res = await fetch('/api/products');
  const products = await res.json();
  const container = document.getElementById('adminProducts');
  container.innerHTML = products.map(p => `
    <div>
      <h4>${p.name}</h4>
      <p>${p.price}</p>
    </div>
  `).join('');
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const product = Object.fromEntries(formData.entries());
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  if (res.ok) {
    alert('Product added!');
    fetchAdminProducts();
  } else {
    alert('You must be admin to manage products');
  }
});

function logout() {
  fetch('/api/logout', { method: 'POST' }).then(() => {
    window.location.href = '/';
  });
}

fetchAdminProducts();
