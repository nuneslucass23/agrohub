// main.js - AgroHub
// Comportamentos compartilhados entre as cinco páginas do projeto.

// Marca no menu a página que está aberta no momento.
function setActiveNav() {
    const current = window.location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".ah-nav-link").forEach((link) => {
        const href = link.getAttribute("href");
        const targetPage = href?.split("#")[0] || "index.html";
        const hasHash = href?.includes("#");
        const isActive = targetPage === current && !hasHash;

        link.classList.toggle("active", isActive);
        if (isActive) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

// Fecha o menu mobile depois que o usuário escolhe um link.
function initMobileMenu() {
    const toggle = document.querySelector(".ah-nav-toggle");
    const menu = document.getElementById("ahNavbar");

    if (toggle && menu && !window.bootstrap) {
        toggle.addEventListener("click", () => {
            if (window.bootstrap) return;
            const isOpen = menu.classList.toggle("show");
            toggle.setAttribute("aria-expanded", String(isOpen));
        });
    }

    document.querySelectorAll(".ah-nav-link").forEach((link) => {
        link.addEventListener("click", () => {
            if (!menu || !menu.classList.contains("show")) return;

            if (window.bootstrap) {
                window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
            } else {
                menu.classList.remove("show");
                toggle?.setAttribute("aria-expanded", "false");
            }
        });
    });
}

// Alterna os formulários da página de cadastro.
function initCadastroTabs() {
    const tabs = document.querySelectorAll("[data-tab]");
    const panels = document.querySelectorAll("[data-panel]");

    if (!tabs.length) return;

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            const target = tab.dataset.tab;

            tabs.forEach((item) => {
                item.classList.remove("active");
                item.setAttribute("aria-selected", "false");
            });

            panels.forEach((panel) => {
                panel.classList.add("d-none");
                panel.classList.remove("was-validated");
                hideFormSuccess(panel);
            });
            tab.classList.add("active");
            tab.setAttribute("aria-selected", "true");

            const targetPanel = document.querySelector(`[data-panel="${target}"]`);
            targetPanel?.classList.remove("d-none");
        });
    });
}

// Localiza a mensagem de sucesso dentro do formulário atual.
function getFormSuccess(form) {
    return form?.querySelector("[data-form-success]") || document.getElementById("form-success");
}

// Esconde mensagens antigas quando o usuário volta a preencher o formulário.
function hideFormSuccess(form) {
    const success = getFormSuccess(form);
    success?.classList.add("d-none");
    success?.removeAttribute("role");
}

// Valida formulários com HTML5 e mostra uma mensagem de confirmação.
function initForms() {
    document.querySelectorAll("form[data-ah-form]").forEach((form) => {
        form.querySelectorAll("input, select, textarea").forEach((field) => {
            field.addEventListener("input", () => hideFormSuccess(form));
            field.addEventListener("change", () => hideFormSuccess(form));
        });

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            hideFormSuccess(form);

            if (!form.checkValidity()) {
                form.classList.add("was-validated");
                return;
            }

            const success = getFormSuccess(form);
            success?.classList.remove("d-none");
            success?.setAttribute("role", "status");

            form.reset();
            form.classList.remove("was-validated");
            resetCharCounters(form);
        });
    });
}

// Atualiza o contador de caracteres da mensagem no Fale Conosco.
function initContactCounters() {
    document.querySelectorAll("[data-char-source]").forEach((field) => {
        const form = field.closest("form");
        const counter = form?.querySelector("[data-char-counter]");
        if (!counter) return;

        const updateCounter = () => {
            const max = Number(field.getAttribute("maxlength") || 1000);
            const length = field.value.length;

            counter.textContent = `${length} / ${max}`;
            counter.classList.toggle("warning", length > max * 0.8);
        };

        field.addEventListener("input", updateCounter);
        updateCounter();
    });
}

// Garante que o contador volte para zero depois do envio do formulário.
function resetCharCounters(scope = document) {
    scope.querySelectorAll("[data-char-source]").forEach((field) => {
        const form = field.closest("form");
        const counter = form?.querySelector("[data-char-counter]");
        const max = Number(field.getAttribute("maxlength") || 1000);

        if (counter) {
            counter.textContent = `0 / ${max}`;
            counter.classList.remove("warning");
        }
    });
}

// Mantém a navegação por âncoras suave dentro da Home.
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"], a[href*="index.html#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (event) {
            const hash = this.getAttribute("href")?.split("#")[1];
            if (!hash) return;

            const target = document.getElementById(hash);
            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });
}

// Configura os filtros do painel da ONG.
function initOngFilters() {
    const filterGroup = document.querySelector("[data-filter-group]");
    const range = document.querySelector("[data-range]");

    if (!filterGroup && !range) return;

    filterGroup?.addEventListener("click", (event) => {
        const button = event.target.closest("[data-filter]");
        if (!button) return;

        filterGroup.querySelectorAll("[data-filter]").forEach((item) => {
            const isSelected = item === button;
            item.classList.toggle("active", isSelected);
            item.setAttribute("aria-pressed", String(isSelected));
        });
        applyOngFilters();
    });

    range?.addEventListener("input", () => {
        const label = document.querySelector("[data-range-label]");
        if (label) label.textContent = range.value;
        applyOngFilters();
    });

    applyOngFilters();
}

// Aplica os filtros atuais aos cards de excedentes.
function applyOngFilters() {
    const activeFilter = document.querySelector("[data-filter].active")?.dataset.filter || "todos";
    const maxDistance = Number(document.querySelector("[data-range]")?.value || 9999);
    const cards = document.querySelectorAll("[data-donation-list] .ah-list-item");
    const empty = document.querySelector("[data-empty-state]");
    let visible = 0;

    cards.forEach((card) => {
        const sameCategory = activeFilter === "todos" || card.dataset.category === activeFilter;
        const sameDistance = Number(card.dataset.distance || 0) <= maxDistance;
        const shouldShow = sameCategory && sameDistance;

        card.classList.toggle("d-none", !shouldShow);
        if (shouldShow) visible += 1;
    });

    empty?.classList.toggle("show", visible === 0);
}

// Atualiza o card quando uma coleta é agendada.
function initScheduleButtons() {
    document.querySelectorAll("[data-schedule]").forEach((button) => {
        button.addEventListener("click", () => {
            if (button.disabled) return;

            const card = button.closest(".ah-list-item");
            const badge = card?.querySelector(".ah-badge");

            button.textContent = "Agendado";
            button.disabled = true;
            button.setAttribute("aria-label", "Coleta agendada");
            card?.classList.add("is-scheduled");

            if (badge) {
                badge.textContent = "Agendado";
                badge.className = "ah-badge ah-badge-muted";
            }
        });
    });
}

// Inicialização geral do site.
document.addEventListener("DOMContentLoaded", () => {
    setActiveNav();
    initMobileMenu();
    initCadastroTabs();
    initForms();
    initContactCounters();
    initSmoothScroll();
    initOngFilters();
    initScheduleButtons();
});
