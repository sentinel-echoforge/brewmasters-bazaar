// ═══ CUSTOMER UI ═══

import state from '../systems/state.js';

const customerEl = document.getElementById('customer-panel');
let onServe = null;

export function setServeHandler(handler) {
  onServe = handler;
}

export function showCustomerPanel() {
  customerEl.style.display = 'block';
  renderCustomers();
}

export function renderCustomers() {
  let html = '<h3>🧑‍🤝‍🧑 Customers</h3>';
  
  if (state.customerQueue.length === 0) {
    html += '<p style="color:#6a5a40;font-style:italic;padding:8px">No customers yet...</p>';
  }
  
  for (const customer of state.customerQueue) {
    const elapsed = Date.now() - customer.spawnTime;
    const remaining = Math.max(0, (customer.patience - elapsed) / customer.patience * 100);
    
    html += `
      <div class="customer-card" data-id="${customer.id}">
        <span class="emoji">${customer.data.emoji}</span>
        <span class="name">${customer.data.name}</span>
        <div class="speech">"${customer.speech}"</div>
        <div class="patience-bar"><div class="patience-fill" style="width:${remaining}%"></div></div>
    `;
    
    if (customer.served) {
      const emoji = customer.reaction === 'perfect' ? '😍' : customer.reaction === 'good' ? '😊' : '😤';
      html += `<div style="text-align:center;margin-top:6px;font-size:1.5rem">${emoji}</div>`;
    } else if (state.brewedDrinks.length > 0) {
      html += '<div style="margin-top:6px">';
      for (let i = 0; i < state.brewedDrinks.length; i++) {
        const drink = state.brewedDrinks[i];
        const stars = '★'.repeat(drink.recipe.stars) + '☆'.repeat(Math.max(0, 5 - drink.recipe.stars));
        html += `
          <button class="serve-btn" data-customer="${customer.id}" data-drink="${i}">
            Serve: ${drink.recipe.name} ${stars}
          </button>
        `;
      }
      html += '</div>';
    } else {
      html += '<p style="color:#6a5a40;font-size:0.8rem;margin-top:6px">Brew something to serve!</p>';
    }
    
    html += '</div>';
  }
  
  customerEl.innerHTML = html;
  
  // Attach serve handlers
  customerEl.querySelectorAll('.serve-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const customerId = parseFloat(btn.dataset.customer);
      const drinkIndex = parseInt(btn.dataset.drink);
      if (onServe) onServe(customerId, drinkIndex);
    });
  });
}
