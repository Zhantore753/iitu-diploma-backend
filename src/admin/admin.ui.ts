export const ADMIN_HTML = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Agri Rental Admin</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f5f7f3;
      --panel: #ffffff;
      --ink: #162019;
      --muted: #66736a;
      --line: #dfe6dc;
      --accent: #236247;
      --accent-2: #d48b2a;
      --danger: #bd3d3d;
      --soft: #eaf2ec;
      --shadow: 0 18px 45px rgba(29, 54, 38, .12);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--ink);
    }
    button, input, textarea, select { font: inherit; }
    button {
      border: 0;
      border-radius: 8px;
      padding: 10px 14px;
      cursor: pointer;
      background: var(--accent);
      color: white;
      font-weight: 700;
    }
    button.secondary { background: #eef4ef; color: var(--ink); }
    button.danger { background: var(--danger); }
    button:disabled { opacity: .55; cursor: not-allowed; }
    input, textarea, select {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px 11px;
      background: #fff;
      color: var(--ink);
      outline: none;
    }
    input:focus, textarea:focus, select:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(35, 98, 71, .13);
    }
    textarea { min-height: 92px; resize: vertical; }
    .layout { min-height: 100vh; display: grid; grid-template-columns: 280px minmax(0, 1fr); }
    .sidebar {
      position: sticky;
      top: 0;
      height: 100vh;
      padding: 22px;
      background: #17231c;
      color: white;
      overflow: auto;
    }
    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 26px; }
    .mark {
      width: 42px; height: 42px; border-radius: 8px;
      display: grid; place-items: center;
      background: #f0b35a; color: #17231c; font-weight: 900;
    }
    .brand strong { display: block; font-size: 18px; }
    .brand span { color: rgba(255,255,255,.62); font-size: 13px; }
    .nav { display: grid; gap: 6px; }
    .nav button {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: transparent;
      color: rgba(255,255,255,.76);
      padding: 11px 10px;
      text-align: left;
      font-weight: 650;
    }
    .nav button.active, .nav button:hover { background: rgba(255,255,255,.1); color: white; }
    .main { min-width: 0; padding: 26px; }
    .topbar {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      align-items: center;
      margin-bottom: 22px;
    }
    h1 { margin: 0; font-size: 30px; letter-spacing: 0; }
    .subtle { color: var(--muted); margin-top: 6px; }
    .actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .stats {
      display: grid;
      grid-template-columns: repeat(5, minmax(120px, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }
    .stat {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 8px 22px rgba(29,54,38,.06);
    }
    .stat span { display: block; color: var(--muted); font-size: 13px; }
    .stat strong { display: block; margin-top: 8px; font-size: 24px; }
    .workspace {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 420px;
      gap: 18px;
      align-items: start;
    }
    .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    .panel-head {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--line);
    }
    .search { max-width: 360px; }
    .table-wrap { overflow: auto; max-height: calc(100vh - 280px); }
    table { width: 100%; border-collapse: collapse; min-width: 720px; }
    th, td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
      font-size: 14px;
    }
    th {
      position: sticky;
      top: 0;
      background: #f7faf6;
      z-index: 1;
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: .04em;
    }
    tr:hover td { background: #fbfcfa; }
    td .row-actions { display: flex; gap: 8px; }
    .form { padding: 16px; display: grid; gap: 12px; }
    .form-title { padding: 16px 16px 0; }
    .form-title strong { font-size: 18px; }
    .field label {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 7px;
      color: var(--muted);
      font-size: 13px;
      font-weight: 700;
    }
    .field small { color: #9aa59d; font-weight: 600; }
    .upload-preview {
      width: 100%;
      aspect-ratio: 16 / 10;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid var(--line);
      background: #eef4ef;
      margin-bottom: 10px;
    }
    .upload-preview.hidden { display: none; }
    .table-thumb {
      width: 92px;
      height: 62px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid var(--line);
      background: #eef4ef;
      display: block;
    }
    .muted-path {
      color: var(--muted);
      display: inline-block;
      max-width: 260px;
      overflow: hidden;
      text-overflow: ellipsis;
      vertical-align: bottom;
      white-space: nowrap;
    }
    .checkbox-row {
      display: flex;
      gap: 10px;
      align-items: center;
      padding: 10px 0;
    }
    .checkbox-row input { width: auto; }
    .notice {
      margin-bottom: 14px;
      padding: 12px 14px;
      border-radius: 8px;
      display: none;
      border: 1px solid var(--line);
      background: white;
    }
    .notice.show { display: block; }
    .notice.error { border-color: rgba(189,61,61,.25); color: var(--danger); background: #fff5f5; }
    .notice.ok { border-color: rgba(35,98,71,.25); color: var(--accent); background: #f2faf4; }
    .login {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 20px;
      background:
        linear-gradient(115deg, rgba(35,98,71,.95), rgba(23,35,28,.95)),
        url("https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80") center/cover;
    }
    .login-card {
      width: min(440px, 100%);
      background: rgba(255,255,255,.96);
      border: 1px solid rgba(255,255,255,.65);
      border-radius: 8px;
      box-shadow: 0 24px 70px rgba(0,0,0,.25);
      padding: 26px;
    }
    .login-card h1 { font-size: 28px; margin-bottom: 8px; }
    .login-card form { display: grid; gap: 13px; margin-top: 20px; }
    .empty { padding: 36px; text-align: center; color: var(--muted); }
    .hidden { display: none !important; }
    @media (max-width: 1120px) {
      .layout { grid-template-columns: 1fr; }
      .sidebar { position: static; height: auto; }
      .workspace { grid-template-columns: 1fr; }
      .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 640px) {
      .main { padding: 16px; }
      .topbar { align-items: flex-start; flex-direction: column; }
      .stats { grid-template-columns: 1fr; }
      .panel-head { align-items: stretch; flex-direction: column; }
      .search { max-width: none; }
    }
  </style>
</head>
<body>
  <section id="loginScreen" class="login">
    <div class="login-card">
      <div class="brand" style="color:#162019;margin-bottom:10px">
        <div class="mark">A</div>
        <div><strong>Agri Rental</strong><span style="color:#66736a">панель администратора</span></div>
      </div>
      <h1>Вход в админку</h1>
      <p class="subtle">Войдите под пользователем с ролью admin. Токен сохранится только в этом браузере.</p>
      <form id="loginForm">
        <div class="field"><label>Email</label><input id="email" type="email" autocomplete="email" required /></div>
        <div class="field"><label>Пароль</label><input id="password" type="password" autocomplete="current-password" required /></div>
        <button type="submit">Войти</button>
      </form>
    </div>
  </section>

  <section id="app" class="layout hidden">
    <aside class="sidebar">
      <div class="brand">
        <div class="mark">A</div>
        <div><strong>Agri Rental</strong><span>admin console</span></div>
      </div>
      <nav id="nav" class="nav"></nav>
    </aside>
    <main class="main">
      <div id="notice" class="notice"></div>
      <div class="topbar">
        <div>
          <h1 id="title">Админка</h1>
          <div id="subtitle" class="subtle">Создание, редактирование и удаление данных</div>
        </div>
        <div class="actions">
          <button class="secondary" id="refreshBtn" type="button">Обновить</button>
          <button class="secondary" id="logoutBtn" type="button">Выйти</button>
        </div>
      </div>
      <section id="stats" class="stats"></section>
      <section class="workspace">
        <div class="panel">
          <div class="panel-head">
            <input id="search" class="search" placeholder="Поиск по текущему разделу" />
            <div class="actions">
              <button id="newBtn" type="button">Создать</button>
            </div>
          </div>
          <div id="table" class="table-wrap"></div>
        </div>
        <aside class="panel">
          <div class="form-title"><strong id="formTitle">Новая запись</strong></div>
          <form id="editor" class="form"></form>
        </aside>
      </section>
    </main>
  </section>

  <script>
    var state = {
      token: localStorage.getItem("adminToken") || "",
      resources: [],
      active: null,
      editingId: null,
      searchTimer: null
    };

    var loginScreen = document.getElementById("loginScreen");
    var app = document.getElementById("app");
    var nav = document.getElementById("nav");
    var stats = document.getElementById("stats");
    var title = document.getElementById("title");
    var subtitle = document.getElementById("subtitle");
    var table = document.getElementById("table");
    var editor = document.getElementById("editor");
    var formTitle = document.getElementById("formTitle");
    var search = document.getElementById("search");
    var notice = document.getElementById("notice");

    function unwrap(payload) {
      return payload && Object.prototype.hasOwnProperty.call(payload, "data") ? payload.data : payload;
    }

    async function request(url, options) {
      options = options || {};
      options.headers = Object.assign({
        "content-type": "application/json"
      }, options.headers || {});
      if (state.token) options.headers.authorization = "Bearer " + state.token;
      var response = await fetch(url, options);
      var text = await response.text();
      var payload = text ? JSON.parse(text) : null;
      if (!response.ok) {
        var message = payload && (payload.message || payload.error) ? payload.message || payload.error : "Ошибка запроса";
        throw new Error(Array.isArray(message) ? message.join(", ") : message);
      }
      return unwrap(payload);
    }

    function showNotice(message, type) {
      notice.textContent = message;
      notice.className = "notice show " + (type || "ok");
      window.setTimeout(function () { notice.className = "notice"; }, 3800);
    }

    function showApp(isReady) {
      loginScreen.classList.toggle("hidden", isReady);
      app.classList.toggle("hidden", !isReady);
    }

    async function init() {
      if (!state.token) return showApp(false);
      try {
        state.resources = await request("/admin/api/resources");
        renderNav();
        await renderDashboard();
        setActive(state.resources[0].key);
        showApp(true);
      } catch (error) {
        localStorage.removeItem("adminToken");
        state.token = "";
        showApp(false);
      }
    }

    function renderNav() {
      nav.innerHTML = "";
      state.resources.forEach(function (resource) {
        var button = document.createElement("button");
        button.type = "button";
        button.dataset.key = resource.key;
        button.innerHTML = "<span>" + resource.label + "</span><span>›</span>";
        button.addEventListener("click", function () { setActive(resource.key); });
        nav.appendChild(button);
      });
    }

    async function renderDashboard() {
      var data = await request("/admin/api/dashboard");
      var cards = [
        ["Пользователи", data.users],
        ["Техника", data.machines],
        ["Аренды", data.rentals],
        ["Ожидают", data.pendingRentals],
        ["Отзывы", data.reviews]
      ];
      stats.innerHTML = cards.map(function (card) {
        return "<div class='stat'><span>" + card[0] + "</span><strong>" + formatValue(card[1]) + "</strong></div>";
      }).join("");
    }

    function setActive(key) {
      state.active = state.resources.find(function (item) { return item.key === key; });
      state.editingId = null;
      search.value = "";
      title.textContent = state.active.label;
      subtitle.textContent = "Раздел: " + state.active.key;
      Array.from(nav.querySelectorAll("button")).forEach(function (button) {
        button.classList.toggle("active", button.dataset.key === key);
      });
      renderForm();
      loadRows();
    }

    async function loadRows() {
      if (!state.active) return;
      table.innerHTML = "<div class='empty'>Загрузка...</div>";
      try {
        var data = await request("/admin/api/" + state.active.key + "?take=50&search=" + encodeURIComponent(search.value));
        renderTable(data.items || []);
      } catch (error) {
        table.innerHTML = "<div class='empty'>" + escapeHtml(error.message) + "</div>";
      }
    }

    function renderTable(items) {
      if (!items.length) {
        table.innerHTML = "<div class='empty'>Записей пока нет</div>";
        return;
      }
      var headers = state.active.tableFields;
      var html = "<table><thead><tr>" + headers.map(function (field) {
        return "<th>" + labelFor(field) + "</th>";
      }).join("") + "<th>Действия</th></tr></thead><tbody>";

      html += items.map(function (item) {
        return "<tr>" + headers.map(function (field) {
          return "<td>" + renderCell(item, field) + "</td>";
        }).join("") + "<td><div class='row-actions'><button class='secondary' data-edit='" + item.id + "' type='button'>Изменить</button><button class='danger' data-delete='" + item.id + "' type='button'>Удалить</button></div></td></tr>";
      }).join("");
      table.innerHTML = html + "</tbody></table>";

      table.querySelectorAll("[data-edit]").forEach(function (button) {
        button.addEventListener("click", function () { editRow(button.dataset.edit); });
      });
      table.querySelectorAll("[data-delete]").forEach(function (button) {
        button.addEventListener("click", function () { deleteRow(button.dataset.delete); });
      });
    }

    function renderForm(item) {
      item = item || {};
      formTitle.textContent = state.editingId ? "Редактирование #" + state.editingId : "Новая запись";
      var fields = state.active.fields.filter(function (field) { return !field.readonly; });
      editor.innerHTML = fields.map(function (field) {
        var value = item[field.name] == null ? "" : item[field.name];
        var required = field.required && !(state.active.key === "users" && field.name === "password" && state.editingId) ? "required" : "";
        if (field.type === "boolean") {
          return "<label class='checkbox-row'><input name='" + field.name + "' type='checkbox' " + (value ? "checked" : "") + " />" + field.label + "</label>";
        }
        if (field.relation) {
          return fieldWrap(field, "<select name='" + field.name + "' data-relation-field='" + field.name + "' data-current='" + escapeHtml(value) + "' " + required + "><option value=''>Загрузка...</option></select>");
        }
        if (field.type === "enum") {
          var options = (field.options || []).map(function (option) {
            return "<option value='" + escapeHtml(option) + "' " + (option === value ? "selected" : "") + ">" + escapeHtml(option) + "</option>";
          }).join("");
          return fieldWrap(field, "<select name='" + field.name + "' " + required + "><option value=''>Не выбрано</option>" + options + "</select>");
        }
        if (state.active.key === "machinePhotos" && field.name === "url") {
          var previewClass = value ? "upload-preview" : "upload-preview hidden";
          return fieldWrap(
            field,
            "<img class='" + previewClass + "' data-upload-preview='url' src='" + escapeHtml(value || "") + "' alt='Фото техники' />" +
            "<input name='url' type='hidden' value='" + escapeHtml(value) + "' " + required + " />" +
            "<input name='urlFile' type='file' accept='image/*' />"
          );
        }
        if (field.multiline) {
          return fieldWrap(field, "<textarea name='" + field.name + "' " + required + ">" + escapeHtml(value) + "</textarea>");
        }
        var type = field.type === "date" ? "datetime-local" : field.type === "string" ? "text" : "number";
        var step = field.type === "float" || field.type === "decimal" ? "step='any'" : "";
        var inputValue = field.type === "date" ? toDateInput(value) : value;
        var inputType = field.sensitive ? "password" : type;
        return fieldWrap(field, "<input name='" + field.name + "' type='" + inputType + "' value='" + escapeHtml(inputValue) + "' " + step + " " + required + " />");
      }).join("") + "<div class='actions'><button type='submit'>" + (state.editingId ? "Сохранить" : "Создать") + "</button><button class='secondary' id='resetForm' type='button'>Очистить</button></div>";

      document.getElementById("resetForm").addEventListener("click", function () {
        state.editingId = null;
        renderForm();
      });
      hydrateRelationSelects();
      bindUploadPreviews();
    }

    function bindUploadPreviews() {
      var fileInput = editor.elements.urlFile;
      if (!fileInput) return;

      fileInput.addEventListener("change", function () {
        var file = fileInput.files && fileInput.files[0];
        var preview = editor.querySelector("[data-upload-preview='url']");
        if (!file || !preview) return;
        preview.src = URL.createObjectURL(file);
        preview.classList.remove("hidden");
      });
    }

    async function hydrateRelationSelects() {
      var selects = Array.from(editor.querySelectorAll("[data-relation-field]"));
      selects.forEach(async function (select) {
        var fieldName = select.dataset.relationField;
        var current = select.dataset.current || "";
        try {
          var options = await request("/admin/api/" + state.active.key + "/" + fieldName + "/options");
          select.innerHTML = "<option value=''>Не выбрано</option>" + options.map(function (option) {
            var value = String(option.id);
            return "<option value='" + escapeHtml(value) + "' " + (value === current ? "selected" : "") + ">" + escapeHtml(option.label) + "</option>";
          }).join("");
        } catch (error) {
          select.innerHTML = "<option value=''>Не удалось загрузить список</option>";
        }
      });
    }

    function fieldWrap(field, control) {
      var hint = field.required ? "<small>обязательно</small>" : "";
      return "<div class='field'><label><span>" + field.label + "</span>" + hint + "</label>" + control + "</div>";
    }

    async function editRow(id) {
      try {
        var item = await request("/admin/api/" + state.active.key + "/" + id);
        state.editingId = id;
        renderForm(item);
      } catch (error) {
        showNotice(error.message, "error");
      }
    }

    async function deleteRow(id) {
      if (!confirm("Удалить запись #" + id + "?")) return;
      try {
        await request("/admin/api/" + state.active.key + "/" + id, { method: "DELETE" });
        showNotice("Запись удалена");
        await Promise.all([loadRows(), renderDashboard()]);
      } catch (error) {
        showNotice(error.message, "error");
      }
    }

    editor.addEventListener("submit", async function (event) {
      event.preventDefault();
      var data = {};
      try {
        if (state.active.key === "machinePhotos") {
          var fileInput = editor.elements.urlFile;
          if (fileInput && fileInput.files && fileInput.files[0]) {
            var upload = await uploadMachinePhoto(fileInput.files[0]);
            editor.elements.url.value = upload.url;
          }
        }

        state.active.fields.forEach(function (field) {
        if (field.readonly) return;
        var control = editor.elements[field.name];
        if (!control) return;
        data[field.name] = field.type === "boolean" ? control.checked : control.value;
      });

        var method = state.editingId ? "PATCH" : "POST";
        var url = "/admin/api/" + state.active.key + (state.editingId ? "/" + state.editingId : "");
        await request(url, { method: method, body: JSON.stringify(data) });
        showNotice(state.editingId ? "Изменения сохранены" : "Запись создана");
        state.editingId = null;
        renderForm();
        await Promise.all([loadRows(), renderDashboard()]);
      } catch (error) {
        showNotice(error.message, "error");
      }
    });

    async function uploadMachinePhoto(file) {
      var formData = new FormData();
      formData.append("file", file);
      var response = await fetch("/admin/api/upload/machine-photo", {
        method: "POST",
        headers: state.token ? { authorization: "Bearer " + state.token } : {},
        body: formData
      });
      var text = await response.text();
      var payload = text ? JSON.parse(text) : null;
      if (!response.ok) {
        var message = payload && (payload.message || payload.error) ? payload.message || payload.error : "Не удалось загрузить файл";
        throw new Error(Array.isArray(message) ? message.join(", ") : message);
      }
      return unwrap(payload);
    }

    document.getElementById("loginForm").addEventListener("submit", async function (event) {
      event.preventDefault();
      try {
        var result = await request("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: document.getElementById("email").value,
            password: document.getElementById("password").value
          })
        });
        state.token = result.accessToken;
        localStorage.setItem("adminToken", state.token);
        await init();
      } catch (error) {
        alert(error.message);
      }
    });

    document.getElementById("logoutBtn").addEventListener("click", function () {
      localStorage.removeItem("adminToken");
      state.token = "";
      showApp(false);
    });

    document.getElementById("refreshBtn").addEventListener("click", function () {
      Promise.all([loadRows(), renderDashboard()]).then(function () {
        showNotice("Данные обновлены");
      }).catch(function (error) {
        showNotice(error.message, "error");
      });
    });

    document.getElementById("newBtn").addEventListener("click", function () {
      state.editingId = null;
      renderForm();
    });

    search.addEventListener("input", function () {
      clearTimeout(state.searchTimer);
      state.searchTimer = setTimeout(loadRows, 250);
    });

    function labelFor(name) {
      var field = state.active.fields.find(function (item) { return item.name === name; });
      return field ? field.label : name;
    }

    function renderCell(item, fieldName) {
      if (state.active.key === "machinePhotos" && fieldName === "url") {
        if (!item.url) return "—";
        return "<a href='" + escapeHtml(item.url) + "' target='_blank' rel='noreferrer'><img class='table-thumb' src='" + escapeHtml(item.url) + "' alt='Фото техники' /></a>";
      }

      var value = formatCell(item, fieldName);
      if (typeof value === "string" && (value.startsWith("/uploads/") || value.startsWith("http"))) {
        return "<span class='muted-path' title='" + escapeHtml(value) + "'>" + escapeHtml(value) + "</span>";
      }

      return escapeHtml(value);
    }

    function formatCell(item, fieldName) {
      var field = state.active.fields.find(function (candidate) { return candidate.name === fieldName; });
      if (!field || !field.relation) return formatValue(item[fieldName]);

      var relationNames = {
        categoryId: "category",
        regionId: "region",
        ownerId: "owner",
        machineId: "machine",
        attachmentId: "attachment",
        renterId: "renter",
        rentalId: "rental",
        participant1Id: "participant1",
        participant2Id: "participant2",
        conversationId: "conversation",
        senderId: "sender",
        userId: "user"
      };
      var relation = item[relationNames[fieldName]];
      if (!relation) return item[fieldName] ? "#" + item[fieldName] : "—";

      var label = relation.name || relation.email || relation.text || relation.status || relation.type;
      if (!label && relation.participant1Id && relation.participant2Id) {
        label = "участники " + relation.participant1Id + " / " + relation.participant2Id;
      }
      return label ? "#" + relation.id + " · " + label : "#" + relation.id;
    }

    function formatValue(value) {
      if (value === null || value === undefined || value === "") return "—";
      if (typeof value === "object") return JSON.stringify(value);
      if (typeof value === "string" && /^\\d{4}-\\d{2}-\\d{2}T/.test(value)) {
        return new Date(value).toLocaleString("ru-RU");
      }
      return String(value);
    }

    function toDateInput(value) {
      if (!value) return "";
      var date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      var offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, function (char) {
        return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char];
      });
    }

    init();
  </script>
</body>
</html>`;
