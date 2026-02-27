function makeId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `card-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const RESERVE_MS = 10 * 60 * 1000;

const startingInventory = [
  {
    id: makeId(),
    title: "Connor McDavid Rookie",
    sport: "Hockey",
    price: 350,
    image: "https://images.unsplash.com/photo-1622519407650-3df9883f76a5?auto=format&fit=crop&w=700&q=80",
    description: "Mint condition rookie card with strong centering and bright foil finish.",
    paypal: "https://www.paypal.com/"
  },
  {
    id: makeId(),
    title: "Patrick Mahomes Prism",
    sport: "Football",
    price: 275,
    image: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=700&q=80",
    description: "Sharp edges and rich color. Popular quarterback insert with high demand.",
    paypal: "https://www.paypal.com/"
  },
  {
    id: makeId(),
    title: "Kobe Bryant Legacy",
    sport: "Basketball",
    price: 420,
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=700&q=80",
    description: "Collector favorite from a limited run. Includes sleeve and top loader.",
    paypal: "https://www.paypal.com/"
  }
];

let cardGrid;
let inventoryList;
let reservationTimer;
let reservationStatus;
let cartCount;
let cartSlider;
let cartEmptyState;
let cartPrev;
let cartNext;
let batchCheckout;
let modal;
let modalImage;
let modalTitle;
let modalDescription;
let modalPrice;
let paypalButton;
let closeModal;
let inventoryPanel;
let openInventoryPanel;
let closeInventoryPanel;
let inventoryForm;

let inventory = [...startingInventory];
let cartItems = [];
let selectedCardTitle = null;
let lastClick = { id: null, time: 0 };

function formatMoney(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getLeadTimer() {
  if (cartItems.length === 0) {
    return "10:00";
  }

  const lead = Math.max(...cartItems.map((item) => item.expiresAt));
  return formatTime(lead - Date.now());
}

function clearCommittedState() {
  cardGrid.classList.remove("committing");
  cardGrid.querySelectorAll(".card").forEach((card) => card.classList.remove("selected"));
}

function reserveCard(card) {
  selectedCardTitle = card.title;
  reservationStatus.textContent = `${card.title} added to cart reserve.`;

  const existing = cartItems.find((item) => item.id === card.id);
  if (existing) {
    existing.expiresAt = Date.now() + RESERVE_MS;
  } else {
    cartItems.push({ ...card, expiresAt: Date.now() + RESERVE_MS });
  }

  renderCart();
}

function updateTimers() {
  cartItems = cartItems.filter((item) => item.expiresAt > Date.now());
  reservationTimer.textContent = getLeadTimer();

  if (cartItems.length === 0) {
    reservationStatus.textContent = selectedCardTitle ? `${selectedCardTitle} went back on the shelf.` : "No card reserved yet.";
    selectedCardTitle = null;
    clearCommittedState();
  }

  cartSlider.querySelectorAll(".cart-item").forEach((node) => {
    const expiresAt = Number(node.dataset.expiresAt);
    node.querySelector(".timer").textContent = formatTime(expiresAt - Date.now());
  });

  cartCount.textContent = `${cartItems.length} card${cartItems.length === 1 ? "" : "s"}`;
}

function showCardModal(card) {
  modalImage.src = card.image;
  modalTitle.textContent = `${card.title} · ${card.sport}`;
  modalDescription.textContent = card.description;
  modalPrice.textContent = formatMoney(card.price);
  paypalButton.href = card.paypal;
  modal.showModal();
}

function commitCardSelection(cardElement, card) {
  clearCommittedState();
  cardGrid.classList.add("committing");
  cardElement.classList.add("selected");
  reserveCard(card);
}

function createText(tag, text) {
  const el = document.createElement(tag);
  el.textContent = text;
  return el;
}

function addCardClickCommit(cardElement, card) {
  cardElement.addEventListener("click", () => {
    const now = Date.now();
    const id = card.id;
    const isSecondClick = lastClick.id === id && now - lastClick.time <= 700;

    lastClick = { id, time: now };

    if (isSecondClick) {
      commitCardSelection(cardElement, card);
    }
  });
}

function renderInventoryList() {
  inventoryList.textContent = "";
  inventory.slice(0, 7).forEach((card) => {
    const item = document.createElement("li");
    item.textContent = `${card.title} • ${card.sport} • ${formatMoney(card.price)}`;
    inventoryList.appendChild(item);
  });
}

function renderCart() {
  cartSlider.textContent = "";
  cartEmptyState.classList.toggle("hidden", cartItems.length > 0);

  cartItems.forEach((item) => {
    const cartItem = document.createElement("article");
    cartItem.className = "cart-item";
    cartItem.dataset.expiresAt = String(item.expiresAt);

    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.title;

    const title = createText("p", `${item.title} · ${item.sport}`);
    const price = createText("p", formatMoney(item.price));
    const timer = createText("p", formatTime(item.expiresAt - Date.now()));
    timer.className = "timer";

    cartItem.append(img, title, price, timer);
    cartSlider.appendChild(cartItem);
  });

  updateTimers();
}

function renderCards() {
  cardGrid.textContent = "";

  inventory.forEach((card) => {
    const cardElement = document.createElement("article");
    cardElement.className = "card";

    const titleBubble = document.createElement("details");
    titleBubble.className = "title-bubble";
    const summary = createText("summary", card.title);
    const description = createText("p", card.description);
    titleBubble.append(summary, description);

    const image = document.createElement("img");
    image.src = card.image;
    image.alt = card.title;
    image.loading = "lazy";

    const footer = document.createElement("div");
    footer.className = "card-footer";
    const price = createText("span", formatMoney(card.price));

    const actions = document.createElement("div");
    actions.className = "card-actions";
    const reserveButton = createText("button", "Reserve");
    reserveButton.className = "buy-btn";
    const quickPay = document.createElement("a");
    quickPay.className = "secondary-btn";
    quickPay.href = card.paypal;
    quickPay.target = "_blank";
    quickPay.rel = "noopener noreferrer";
    quickPay.textContent = "PayPal";

    actions.append(reserveButton, quickPay);
    footer.append(price, actions);
    cardElement.append(titleBubble, image, footer);

    image.addEventListener("click", (event) => {
      event.stopPropagation();
      showCardModal(card);
    });

    reserveButton.addEventListener("click", (event) => {
      event.stopPropagation();
      reserveCard(card);
      clearCommittedState();
    });

    quickPay.addEventListener("click", (event) => {
      event.stopPropagation();
      reserveCard(card);
    });

    addCardClickCommit(cardElement, card);
    cardGrid.appendChild(cardElement);
  });

  renderInventoryList();
}

document.addEventListener("DOMContentLoaded", () => {
  cardGrid = document.querySelector("#cardGrid");
  inventoryList = document.querySelector("#inventoryList");
  reservationTimer = document.querySelector("#reservationTimer");
  reservationStatus = document.querySelector("#reservationStatus");
  cartCount = document.querySelector("#cartCount");
  cartSlider = document.querySelector("#cartSlider");
  cartEmptyState = document.querySelector("#cartEmptyState");
  cartPrev = document.querySelector("#cartPrev");
  cartNext = document.querySelector("#cartNext");
  batchCheckout = document.querySelector("#batchCheckout");
  modal = document.querySelector("#cardModal");
  modalImage = document.querySelector("#modalImage");
  modalTitle = document.querySelector("#modalTitle");
  modalDescription = document.querySelector("#modalDescription");
  modalPrice = document.querySelector("#modalPrice");
  paypalButton = document.querySelector("#paypalButton");
  closeModal = document.querySelector("#closeModal");
  inventoryPanel = document.querySelector("#inventoryPanel");
  openInventoryPanel = document.querySelector("#openInventoryPanel");
  closeInventoryPanel = document.querySelector("#closeInventoryPanel");
  inventoryForm = document.querySelector("#inventoryForm");

  const missing = [];
  if (!cardGrid) missing.push("#cardGrid");
  if (!inventoryList) missing.push("#inventoryList");
  if (!reservationTimer) missing.push("#reservationTimer");
  if (!reservationStatus) missing.push("#reservationStatus");
  if (!cartCount) missing.push("#cartCount");
  if (!cartSlider) missing.push("#cartSlider");
  if (!cartEmptyState) missing.push("#cartEmptyState");
  if (!cartPrev) missing.push("#cartPrev");
  if (!cartNext) missing.push("#cartNext");
  if (!batchCheckout) missing.push("#batchCheckout");
  if (!modal) missing.push("#cardModal");
  if (!modalImage) missing.push("#modalImage");
  if (!modalTitle) missing.push("#modalTitle");
  if (!modalDescription) missing.push("#modalDescription");
  if (!modalPrice) missing.push("#modalPrice");
  if (!paypalButton) missing.push("#paypalButton");
  if (!closeModal) missing.push("#closeModal");
  if (!inventoryPanel) missing.push("#inventoryPanel");
  if (!openInventoryPanel) missing.push("#openInventoryPanel");
  if (!closeInventoryPanel) missing.push("#closeInventoryPanel");
  if (!inventoryForm) missing.push("#inventoryForm");

  if (missing.length) {
    throw new Error("Missing required DOM elements: " + missing.join(", "));
  }

  openInventoryPanel.addEventListener("click", () => inventoryPanel.classList.remove("hidden"));
  closeInventoryPanel.addEventListener("click", () => inventoryPanel.classList.add("hidden"));

  inventoryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(inventoryForm);

    inventory.unshift({
      id: makeId(),
      title: String(formData.get("title") || "").trim(),
      sport: String(formData.get("sport") || "").trim(),
      price: Number(formData.get("price")),
      image: String(formData.get("image") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      paypal: String(formData.get("paypal") || "").trim()
    });

    inventoryForm.reset();
    inventoryPanel.classList.add("hidden");
    renderCards();
  });

  cartPrev.addEventListener("click", () => {
    cartSlider.scrollBy({ left: -cartSlider.clientWidth, behavior: "smooth" });
  });

  cartNext.addEventListener("click", () => {
    cartSlider.scrollBy({ left: cartSlider.clientWidth, behavior: "smooth" });
  });

  batchCheckout.addEventListener("click", () => {
    if (cartItems.length === 0) {
      reservationStatus.textContent = "Add cards to the cart before batch checkout.";
      return;
    }

    cartItems.forEach((item) => {
      window.open(item.paypal, "_blank", "noopener,noreferrer");
    });

    reservationStatus.textContent = `Opened ${cartItems.length} PayPal checkout tab(s).`;
    cartItems = [];
    clearCommittedState();
    renderCart();
  });

  closeModal.addEventListener("click", () => modal.close());
  modal.addEventListener("click", (event) => {
    const bounds = modal.getBoundingClientRect();
    const clickedInDialog =
      event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom;

    if (!clickedInDialog) {
      modal.close();
    }
  });

  renderCards();
  renderCart();
  updateTimers();
  setInterval(updateTimers, 1000);
});
