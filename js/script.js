const DEFAULT_PHOTO = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=82";
const STATUS_LABELS = {
  archived: "Arquivado",
  draft: "Rascunho",
  published: "Novidade",
  reserved: "Reservado",
  sold: "Vendido"
};
const FUEL_LABELS = {
  diesel: "Diesel",
  eletrico: "Elétrico",
  flex: "Flex",
  gasolina: "Gasolina",
  hibrido: "Híbrido"
};
const TRANSMISSION_LABELS = {
  automatico: "Automático",
  cvt: "CVT",
  manual: "Manual"
};
const DEMO_SETTINGS = {
  whatsapp: ""
};
const SUPABASE_CONNECTION_ERROR = "Supabase indisponivel. Reative o projeto ou confira URL e anon key.";
const DEMO_VEHICLES = [
  {
    id: "demo-corolla-cross",
    name: "Toyota Corolla Cross",
    version: "2.0 VVT-IE Flex XR Direct Shift",
    model_year: "2024/2025",
    mileage_km: 9200,
    price_cents: 13199900,
    fuel: "flex",
    transmission: "cvt",
    color: "Prata",
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=82",
    highlights: ["Garantia", "SUV", "Baixa km"],
    engine: "2.0 aspirado",
    horsepower: 177,
    torque: "21,4 kgfm",
    drivetrain: "Dianteira",
    doors: 4,
    seats: 5,
    plate_final: "7",
    sort_order: 10,
    description: "SUV familiar com excelente consumo, pacote completo e interior conservado."
  },
  {
    id: "demo-jeep-gladiator",
    name: "Jeep Gladiator",
    version: "3.6 V6 Gasolina Rubicon 4P 4x4 AT8",
    model_year: "2023/2024",
    mileage_km: 18000,
    price_cents: 35499900,
    fuel: "gasolina",
    transmission: "automatico",
    color: "Branco",
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=82",
    highlights: ["4x4", "Rubicon", "Pronta entrega"],
    engine: "3.6 V6",
    horsepower: 284,
    torque: "35,4 kgfm",
    drivetrain: "4x4",
    doors: 4,
    seats: 5,
    plate_final: "3",
    sort_order: 9,
    description: "Picape premium com pacote off-road, revisões em dia e excelente estado."
  },
  {
    id: "demo-nivus",
    name: "Volkswagen Nivus",
    version: "1.0 200 TSI Total Flex Highline Automático",
    model_year: "2022/2023",
    mileage_km: 26500,
    price_cents: 11890000,
    fuel: "flex",
    transmission: "automatico",
    color: "Vermelho",
    status: "published",
    cover_image_url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=82",
    highlights: ["Highline", "Turbo", "Completo"],
    engine: "1.0 TSI turbo",
    horsepower: 128,
    torque: "20,4 kgfm",
    drivetrain: "Dianteira",
    doors: 4,
    seats: 5,
    plate_final: "9",
    sort_order: 8,
    description: "Modelo com central multimídia, rodas de liga e pacote de segurança."
  }
];

let vehiclesCache = [];
let settingsCache = { whatsapp: "" };
let usingDemoData = false;
const loaderStartedAt = Date.now();

document.body.classList.add("is-loading");

function finishPageLoading() {
  const elapsed = Date.now() - loaderStartedAt;
  const delay = Math.max(0, 250 - elapsed);

  window.setTimeout(() => {
    document.body.classList.remove("is-loading");
    document.body.classList.add("is-ready");
  }, delay);
}

function createClient() {
  const config = window.GONCALES_SUPABASE || {};

  if (!window.supabase || !config.url || !config.anonKey || config.url.includes("COLE_AQUI")) {
    return null;
  }

  return window.supabase.createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

const supabaseClient = createClient();

function requireSupabase() {
  if (!supabaseClient) {
    throw new Error("Configure a URL e a anon key em js/supabase-config.js");
  }

  return supabaseClient;
}

function formatCurrencyFromCents(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2
  }).format((Number(value) || 0) / 100);
}

function formatMileage(value) {
  return new Intl.NumberFormat("pt-BR").format(Number(value) || 0);
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function parseMoneyToCents(value) {
  const clean = String(value || "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");

  return Math.round((Number.parseFloat(clean) || 0) * 100);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function labelFrom(map, value) {
  return map[value] || value || "-";
}

function vehiclePhoto(vehicle) {
  return vehicle.cover_image_url || DEFAULT_PHOTO;
}

function buildWhatsAppUrl(vehicle) {
  const phone = onlyDigits(settingsCache.whatsapp);
  const message = `Olá, vi o ${vehicle.name} ${vehicle.version} ${vehicle.model_year} no site da Gonçales Veículos por ${formatCurrencyFromCents(vehicle.price_cents)}. Gostaria de negociar.`;
  const base = phone ? `https://wa.me/${phone}` : "https://api.whatsapp.com/send";

  return `${base}?text=${encodeURIComponent(message)}`;
}

function showToast(message) {
  document.body.dataset.toast = message;
  document.body.classList.add("toast-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    document.body.classList.remove("toast-visible");
  }, 2600);
}

function isSupabaseConnectionError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  const details = String(error?.details || error?.hint || "").toLowerCase();
  const status = Number(error?.status || error?.code || 0);
  const text = `${message} ${details}`;

  return status === 521
    || text.includes("failed to fetch")
    || text.includes("fetch failed")
    || text.includes("load failed")
    || text.includes("networkerror")
    || text.includes("network request failed")
    || text.includes("web server is down")
    || text.includes("unexpected token '<'");
}

function friendlySupabaseConnectionMessage(error) {
  return isSupabaseConnectionError(error) ? SUPABASE_CONNECTION_ERROR : "";
}

function friendlyDatabaseMessage(error) {
  const connectionMessage = friendlySupabaseConnectionMessage(error);

  if (connectionMessage) {
    return connectionMessage;
  }

  const message = String(error?.message || "Erro no banco de dados");
  const normalized = message.toLowerCase();

  if (normalized.includes("row-level security") || normalized.includes("permission denied")) {
    return "Permissoes do painel sem login ainda nao foram aplicadas. Rode database/fix-owner-admin.sql no Supabase.";
  }

  if (normalized.includes("could not find the function") && normalized.includes("claim_owner_admin")) {
    return "Rode database/fix-owner-admin.sql no Supabase para liberar o painel sem login.";
  }

  if (normalized.includes("not allowed to manage this store")) {
    return "Este e-mail nao esta autorizado a gerenciar a loja.";
  }

  return message;
}

async function fetchSettings() {
  if (!supabaseClient) {
    settingsCache = DEMO_SETTINGS;
    usingDemoData = true;
    return settingsCache;
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from("store_settings")
    .select("store_name, whatsapp, instagram_url, address")
    .eq("id", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  settingsCache = data || { whatsapp: "" };
  return settingsCache;
}

async function fetchVehicles({ admin = false } = {}) {
  if (!supabaseClient) {
    vehiclesCache = admin ? [] : [...DEMO_VEHICLES];
    usingDemoData = true;
    return vehiclesCache;
  }

  const client = requireSupabase();
  let query = client
    .from("vehicles")
    .select("*")
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });

  if (!admin) {
    query = query.in("status", ["published", "reserved"]);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  vehiclesCache = data || [];
  usingDemoData = false;
  return vehiclesCache;
}

function renderHighlights(vehicle) {
  const items = Array.isArray(vehicle.highlights) ? vehicle.highlights.filter(Boolean).slice(0, 3) : [];

  if (!items.length) {
    return "";
  }

  return `<div class="highlight-row">${items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>`;
}

function detailRows(vehicle) {
  return [
    ["Motor", vehicle.engine],
    ["Cavalagem", vehicle.horsepower ? `${vehicle.horsepower} cv` : ""],
    ["Torque", vehicle.torque],
    ["Tração", vehicle.drivetrain],
    ["Combustível", labelFrom(FUEL_LABELS, vehicle.fuel)],
    ["Câmbio", labelFrom(TRANSMISSION_LABELS, vehicle.transmission)],
    ["Ano", vehicle.model_year],
    ["Quilometragem", `${formatMileage(vehicle.mileage_km)} km`],
    ["Cor", vehicle.color],
    ["Portas", vehicle.doors],
    ["Lugares", vehicle.seats],
    ["Final da placa", vehicle.plate_final]
  ].filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "");
}

function vehicleCard(vehicle) {
  return `
    <article class="vehicle-card">
      <div class="vehicle-media">
        <img src="${escapeHtml(vehiclePhoto(vehicle))}" alt="${escapeHtml(vehicle.name)}" loading="lazy">
        <span class="status-badge">${escapeHtml(labelFrom(STATUS_LABELS, vehicle.status))}</span>
      </div>
      <div class="vehicle-body">
        <div class="vehicle-title">
          <h2>${escapeHtml(vehicle.name)}</h2>
          <p>${escapeHtml(vehicle.version)}</p>
        </div>
        <dl class="spec-list">
          <div>
            <dt>Ano</dt>
            <dd>${escapeHtml(vehicle.model_year)}</dd>
          </div>
          <div>
            <dt>Km</dt>
            <dd>${formatMileage(vehicle.mileage_km)}</dd>
          </div>
          <div>
            <dt>Câmbio</dt>
            <dd>${escapeHtml(labelFrom(TRANSMISSION_LABELS, vehicle.transmission))}</dd>
          </div>
          <div>
            <dt>Cor</dt>
            <dd>${escapeHtml(vehicle.color)}</dd>
          </div>
        </dl>
        ${renderHighlights(vehicle)}
        <div class="price-row">
          <span>
            Valor
            <strong>${formatCurrencyFromCents(vehicle.price_cents)}</strong>
          </span>
        </div>
        <div class="card-actions">
          <button class="details-button" type="button" data-details-id="${escapeHtml(vehicle.id)}">Ver detalhes</button>
          <a class="deal-button" href="${buildWhatsAppUrl(vehicle)}" target="_blank" rel="noopener">Negociar</a>
        </div>
      </div>
    </article>
  `;
}

function uniqueOptions(vehicles, key, labels) {
  return [...new Set(vehicles.map((vehicle) => vehicle[key]).filter(Boolean))]
    .sort((a, b) => labelFrom(labels, a).localeCompare(labelFrom(labels, b)))
    .map((value) => ({ value, label: labelFrom(labels, value) }));
}

function fillSelect(select, values) {
  const current = select.value;
  select.innerHTML = '<option value="">Todos</option>';
  values.forEach(({ value, label }) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.append(option);
  });
  select.value = values.some((item) => item.value === current) ? current : "";
}

function closeCustomSelects(except) {
  document.querySelectorAll(".custom-select.is-open").forEach((customSelect) => {
    if (customSelect !== except) {
      customSelect.classList.remove("is-open");
      customSelect.querySelector(".custom-select-options").hidden = true;
    }
  });
}

function syncCustomSelect(select) {
  const customSelect = select.nextElementSibling;

  if (!customSelect?.classList.contains("custom-select")) {
    return;
  }

  const selected = select.options[select.selectedIndex];
  customSelect.querySelector(".custom-select-button span").textContent = selected?.textContent || "Todos";
  customSelect.querySelectorAll("[data-value]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.value === select.value);
  });
}

function createCustomSelect(select) {
  const customSelect = document.createElement("div");
  const trigger = document.createElement("button");
  const label = document.createElement("span");
  const options = document.createElement("ul");

  select.classList.add("is-native-hidden");
  customSelect.className = "custom-select";
  trigger.className = "custom-select-button";
  trigger.type = "button";
  options.className = "custom-select-options";
  options.hidden = true;
  trigger.append(label);

  [...select.options].forEach((option) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.value = option.value;
    button.textContent = option.textContent;
    item.append(button);
    options.append(item);
  });

  trigger.addEventListener("click", () => {
    const isOpen = customSelect.classList.toggle("is-open");
    closeCustomSelects(customSelect);
    options.hidden = !isOpen;
  });

  options.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-value]");

    if (!button) {
      return;
    }

    select.value = button.dataset.value;
    syncCustomSelect(select);
    closeCustomSelects();
    select.dispatchEvent(new Event("input", { bubbles: true }));
  });

  customSelect.append(trigger, options);
  select.insertAdjacentElement("afterend", customSelect);
  syncCustomSelect(select);
}

function renderDetails(vehicle) {
  const rows = detailRows(vehicle);

  return `
    <div class="details-card">
      <button class="details-close" type="button" aria-label="Fechar">×</button>
      <img src="${escapeHtml(vehiclePhoto(vehicle))}" alt="${escapeHtml(vehicle.name)}">
      <div class="details-copy">
        <span>${escapeHtml(labelFrom(STATUS_LABELS, vehicle.status))}</span>
        <h2>${escapeHtml(vehicle.name)}</h2>
        <p>${escapeHtml(vehicle.version)}</p>
        <strong>${formatCurrencyFromCents(vehicle.price_cents)}</strong>
        <dl class="details-list">
          ${rows.map(([label, value]) => `
            <div>
              <dt>${escapeHtml(label)}</dt>
              <dd>${escapeHtml(value)}</dd>
            </div>
          `).join("")}
        </dl>
        ${vehicle.description ? `<p class="details-description">${escapeHtml(vehicle.description)}</p>` : ""}
        <a class="deal-button" href="${buildWhatsAppUrl(vehicle)}" target="_blank" rel="noopener">Negociar no WhatsApp</a>
      </div>
    </div>
  `;
}

function openDetails(vehicleId) {
  const dialog = document.querySelector("#detailsDialog");
  const content = document.querySelector("#detailsContent");
  const vehicle = vehiclesCache.find((item) => item.id === vehicleId);

  if (!dialog || !content || !vehicle) {
    return;
  }

  content.innerHTML = renderDetails(vehicle);
  dialog.showModal();
}

async function initCatalog() {
  const grid = document.querySelector("#catalogGrid");
  const empty = document.querySelector("#emptyState");
  const summary = document.querySelector("#resultSummary");
  const total = document.querySelector("#catalogTotal");
  const search = document.querySelector("#searchInput");
  const fuel = document.querySelector("#fuelFilter");
  const transmission = document.querySelector("#transmissionFilter");
  const sort = document.querySelector("#sortSelect");
  const clear = document.querySelector("#clearFilters");
  const dialog = document.querySelector("#detailsDialog");

  try {
    await fetchSettings();
    await fetchVehicles();
  } catch (error) {
    settingsCache = DEMO_SETTINGS;
    vehiclesCache = [...DEMO_VEHICLES];
    usingDemoData = true;
    showToast(`${friendlyDatabaseMessage(error)} Exibindo estoque demo.`);
  }

  fillSelect(fuel, uniqueOptions(vehiclesCache, "fuel", FUEL_LABELS));
  fillSelect(transmission, uniqueOptions(vehiclesCache, "transmission", TRANSMISSION_LABELS));
  [fuel, transmission, sort].forEach(createCustomSelect);

  function applyFilters() {
    const query = normalizeText(search.value);
    let filtered = [...vehiclesCache];

    if (query) {
      filtered = filtered.filter((vehicle) => normalizeText([
        vehicle.name,
        vehicle.version,
        vehicle.model_year,
        labelFrom(FUEL_LABELS, vehicle.fuel),
        labelFrom(TRANSMISSION_LABELS, vehicle.transmission),
        vehicle.color,
        vehicle.engine,
        vehicle.drivetrain
      ].join(" ")).includes(query));
    }

    if (fuel.value) {
      filtered = filtered.filter((vehicle) => vehicle.fuel === fuel.value);
    }

    if (transmission.value) {
      filtered = filtered.filter((vehicle) => vehicle.transmission === transmission.value);
    }

    if (sort.value === "priceAsc") {
      filtered.sort((a, b) => a.price_cents - b.price_cents);
    }

    if (sort.value === "priceDesc") {
      filtered.sort((a, b) => b.price_cents - a.price_cents);
    }

    if (sort.value === "yearDesc") {
      filtered.sort((a, b) => String(b.model_year).localeCompare(String(a.model_year)));
    }

    total.textContent = `${vehiclesCache.length} ${vehiclesCache.length === 1 ? "carro" : "carros"}`;
    summary.textContent = `${filtered.length} ${filtered.length === 1 ? "resultado" : "resultados"} no estoque${usingDemoData ? " (demo)" : ""}`;
    grid.innerHTML = filtered.map(vehicleCard).join("");
    empty.hidden = filtered.length > 0;
  }

  [search, fuel, transmission, sort].forEach((control) => control.addEventListener("input", applyFilters));

  clear.addEventListener("click", () => {
    search.value = "";
    fuel.value = "";
    transmission.value = "";
    sort.value = "featured";
    [fuel, transmission, sort].forEach(syncCustomSelect);
    applyFilters();
  });

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-details-id]");

    if (button) {
      openDetails(button.dataset.detailsId);
    }
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog || event.target.closest(".details-close")) {
      dialog.close();
    }
  });

  applyFilters();
}

function resetForm(form) {
  form.reset();
  document.querySelector("#vehicleId").value = "";
  document.querySelector("#saveVehicleButton").textContent = "Salvar veículo";
}

function vehicleFromForm() {
  const highlights = document.querySelector("#carHighlights").value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    name: document.querySelector("#carName").value.trim(),
    version: document.querySelector("#carVersion").value.trim(),
    model_year: document.querySelector("#carYear").value.trim(),
    mileage_km: Number(document.querySelector("#carMileage").value) || 0,
    price_cents: parseMoneyToCents(document.querySelector("#carPrice").value),
    fuel: document.querySelector("#carFuel").value,
    transmission: document.querySelector("#carTransmission").value,
    color: document.querySelector("#carColor").value.trim(),
    status: document.querySelector("#carStatus").value,
    cover_image_url: document.querySelector("#carPhoto").value.trim() || null,
    highlights,
    engine: document.querySelector("#carEngine").value.trim() || null,
    horsepower: Number(document.querySelector("#carHorsepower").value) || null,
    torque: document.querySelector("#carTorque").value.trim() || null,
    drivetrain: document.querySelector("#carDrivetrain").value.trim() || null,
    doors: Number(document.querySelector("#carDoors").value) || null,
    seats: Number(document.querySelector("#carSeats").value) || null,
    plate_final: document.querySelector("#carPlateFinal").value.trim() || null,
    sort_order: Number(document.querySelector("#carSortOrder").value) || 0,
    description: document.querySelector("#carDescription").value.trim()
  };
}

function fillForm(vehicle) {
  document.querySelector("#vehicleId").value = vehicle.id;
  document.querySelector("#carName").value = vehicle.name || "";
  document.querySelector("#carVersion").value = vehicle.version || "";
  document.querySelector("#carYear").value = vehicle.model_year || "";
  document.querySelector("#carMileage").value = vehicle.mileage_km || "";
  document.querySelector("#carPrice").value = vehicle.price_cents ? formatCurrencyFromCents(vehicle.price_cents).replace("R$", "").trim() : "";
  document.querySelector("#carFuel").value = vehicle.fuel || "flex";
  document.querySelector("#carTransmission").value = vehicle.transmission || "automatico";
  document.querySelector("#carColor").value = vehicle.color || "";
  document.querySelector("#carStatus").value = vehicle.status || "published";
  document.querySelector("#carPhoto").value = vehicle.cover_image_url || "";
  document.querySelector("#carHighlights").value = Array.isArray(vehicle.highlights) ? vehicle.highlights.join(", ") : "";
  document.querySelector("#carEngine").value = vehicle.engine || "";
  document.querySelector("#carHorsepower").value = vehicle.horsepower || "";
  document.querySelector("#carTorque").value = vehicle.torque || "";
  document.querySelector("#carDrivetrain").value = vehicle.drivetrain || "";
  document.querySelector("#carDoors").value = vehicle.doors || "";
  document.querySelector("#carSeats").value = vehicle.seats || "";
  document.querySelector("#carPlateFinal").value = vehicle.plate_final || "";
  document.querySelector("#carSortOrder").value = vehicle.sort_order || "";
  document.querySelector("#carDescription").value = vehicle.description || "";
  document.querySelector("#carPhotoFile").value = "";
  document.querySelector("#saveVehicleButton").textContent = "Atualizar veículo";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function adminCard(vehicle) {
  return `
    <article class="admin-card" data-id="${escapeHtml(vehicle.id)}">
      <img src="${escapeHtml(vehiclePhoto(vehicle))}" alt="${escapeHtml(vehicle.name)}" loading="lazy">
      <div class="admin-card-content">
        <div>
          <h3>${escapeHtml(vehicle.name)}</h3>
          <p>${escapeHtml(vehicle.version)}</p>
        </div>
        <strong>${formatCurrencyFromCents(vehicle.price_cents)}</strong>
        <div class="admin-card-actions">
          <button class="mini-button" type="button" data-action="edit">Editar</button>
          <button class="mini-button danger" type="button" data-action="delete">Remover</button>
        </div>
      </div>
    </article>
  `;
}

async function uploadVehicleImage(file) {
  if (!file) {
    return "";
  }

  const client = requireSupabase();
  const config = window.GONCALES_SUPABASE || {};
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage
    .from(config.vehicleImagesBucket || "vehicle-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) {
    throw error;
  }

  const { data } = client.storage
    .from(config.vehicleImagesBucket || "vehicle-images")
    .getPublicUrl(path);

  return data.publicUrl;
}

function setAdminEnabled(enabled) {
  document.body.classList.toggle("admin-login-mode", !enabled);
  document.body.classList.toggle("admin-active-mode", enabled);
  document.querySelector("#adminStatus")?.toggleAttribute("hidden", !enabled);
  document.querySelector("#settingsForm")?.toggleAttribute("hidden", !enabled);
  document.querySelector("#vehicleForm")?.toggleAttribute("hidden", !enabled);
  document.querySelector(".inventory-panel")?.toggleAttribute("hidden", !enabled);
}

function setAdminEmail(email) {
  const label = document.querySelector("#adminSessionEmail");

  if (label) {
    label.textContent = email || "Painel liberado";
  }
}

function setSetupNoticeVisible(visible) {
  const setupNotice = document.querySelector("#setupNotice");

  if (setupNotice) {
    setupNotice.hidden = !visible;
  }
}

async function initAdmin() {
  if (!supabaseClient) {
    setAdminEnabled(false);
    setSetupNoticeVisible(true);
    return;
  }

  setSetupNoticeVisible(false);
  const client = requireSupabase();
  let vehicles = [];
  const form = document.querySelector("#vehicleForm");
  const settingsForm = document.querySelector("#settingsForm");
  const list = document.querySelector("#adminList");
  const empty = document.querySelector("#adminEmpty");

  async function renderList() {
    vehicles = await fetchVehicles({ admin: true });
    list.innerHTML = vehicles.map(adminCard).join("");
    empty.hidden = vehicles.length > 0;
  }

  async function loadAdminData() {
    const settings = await fetchSettings();
    document.querySelector("#storeWhatsapp").value = settings.whatsapp || "";
    await renderList();
  }

  setAdminEmail();
  setAdminEnabled(true);

  try {
    await loadAdminData();
  } catch (error) {
    showToast(friendlyDatabaseMessage(error));
  }

  settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const { error } = await client
      .from("store_settings")
      .update({ whatsapp: onlyDigits(document.querySelector("#storeWhatsapp").value) })
      .eq("id", true);

    if (error) {
      showToast(friendlyDatabaseMessage(error));
      return;
    }

    await fetchSettings();
    showToast("Contato salvo");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const currentId = document.querySelector("#vehicleId").value;
    const file = document.querySelector("#carPhotoFile").files[0];
    const vehicle = vehicleFromForm();

    try {
      const uploadedUrl = await uploadVehicleImage(file);

      if (uploadedUrl) {
        vehicle.cover_image_url = uploadedUrl;
      }

      const result = currentId
        ? await client.from("vehicles").update(vehicle).eq("id", currentId)
        : await client.from("vehicles").insert(vehicle);

      if (result.error) {
        throw result.error;
      }

      await renderList();
      resetForm(form);
      showToast(currentId ? "Veículo atualizado" : "Veículo publicado");
    } catch (error) {
      showToast(friendlyDatabaseMessage(error));
    }
  });

  document.querySelector("#resetFormButton").addEventListener("click", () => resetForm(form));

  list.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
      return;
    }

    const id = button.closest("[data-id]").dataset.id;
    const vehicle = vehicles.find((item) => item.id === id);

    if (!vehicle) {
      return;
    }

    if (button.dataset.action === "edit") {
      fillForm(vehicle);
      return;
    }

    if (button.dataset.action === "delete" && window.confirm(`Remover ${vehicle.name} do catálogo?`)) {
      const { error } = await client.from("vehicles").delete().eq("id", id);

      if (error) {
        showToast(friendlyDatabaseMessage(error));
        return;
      }

      await renderList();
      resetForm(form);
      showToast("Veículo removido");
    }
  });
}

document.addEventListener("click", (event) => {
  if (!event.target.closest(".custom-select")) {
    closeCustomSelects();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "catalog") {
    initCatalog()
      .catch((error) => showToast(friendlyDatabaseMessage(error)))
      .finally(finishPageLoading);
  }

  if (document.body.dataset.page === "admin") {
    initAdmin()
      .catch((error) => showToast(friendlyDatabaseMessage(error)))
      .finally(finishPageLoading);
  }
});
