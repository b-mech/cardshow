const startingInventory = [
  {
    title: "Connor McDavid Rookie",
    sport: "Hockey",
    price: 350,
    image: "https://images.unsplash.com/photo-1622519407650-3df9883f76a5?auto=format&fit=crop&w=700&q=80",
    description: "Mint condition rookie card with strong centering and bright foil finish.",
    paypal: "https://www.paypal.com/"
  },
  {
    title: "Patrick Mahomes Prism",
    sport: "Football",
    price: 275,
    image: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=700&q=80",
    description: "Sharp edges and rich color. Popular quarterback insert with high demand.",
    paypal: "https://www.paypal.com/"
  },
  {
    title: "Kobe Bryant Legacy",
    sport: "Basketball",
    price: 420,
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=700&q=80",
    description: "Collector favorite from a limited run. Includes sleeve and top loader.",
    paypal: "https://www.paypal.com/"
  }
];

const cardGrid = document.querySelector("#cardGrid");
const inventoryList = document.querySelector("#inventoryList");
const reservationTimer = document.querySelector("#reservationTimer");
const reservationStatus = document.querySelector("#reservationStatus");
const modal = document.querySelector("#cardModal");
const modalImage = document.querySelector("#modalImage");
const modalTitle = document.querySelector("#modalTitle");
const modalDescription = document.querySelector("#modalDescription");
const modalPrice = document.querySelector("#modalPrice");
const paypalButton = document.querySelector("#paypalButton");
const closeModal = document.querySelector("#closeModal");
const inventoryPanel = document.querySelector("#inventoryPanel");
const openInventoryPanel = document.querySelector("#openInventoryPanel");
const closeInventoryPanel = document.querySelector("#closeInventoryPanel");
const inventoryForm = document.querySelector("#inventoryForm");

let inventory = [...startingInventory];
let reserveEndsAt = null;
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

function startReservation(title) {
  selectedCardTitle = title;
  reserveEndsAt = Date.now() + 10 * 60 * 1000;
  reservationStatus.textContent = `${title} reserved for checkout.`;
}

function clearCommittedState() {
  cardGrid.classList.remove("committing");
  cardGrid.querySelectorAll(".card").forEach((card) => card.classList.remove("selected"));
}

function updateTimer() {
  if (!reserveEndsAt) {
    reservationTimer.textContent = "10:00";
    return;
  }

  const remaining = reserveEndsAt - Date.now();
  reservationTimer.textContent = formatTime(remaining);

  if (remaining <= 0) {
    reservationStatus.textContent = `${selectedCardTitle} went back on the shelf.`;
    reserveEndsAt = null;
    selectedCardTitle = null;
    clearCommittedState();
  }
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
  startReservation(card.title);
}

function createText(tag, text) {
  const el = document.createElement(tag);
  el.textContent = text;
  return el;
}

function addCardClickCommit(cardElement, card) {
  cardElement.addEventListener("click", () => {
    const now = Date.now();
    const id = card.title;
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
      startReservation(card.title);
      clearCommittedState();
    });

    quickPay.addEventListener("click", (event) => {
      event.stopPropagation();
      startReservation(card.title);
    });

    addCardClickCommit(cardElement, card);
    cardGrid.appendChild(cardElement);
  });

  renderInventoryList();
}

openInventoryPanel.addEventListener("click", () => inventoryPanel.classList.remove("hidden"));
closeInventoryPanel.addEventListener("click", () => inventoryPanel.classList.add("hidden"));

inventoryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(inventoryForm);

  inventory.unshift({
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
updateTimer();
setInterval(updateTimer, 250);
