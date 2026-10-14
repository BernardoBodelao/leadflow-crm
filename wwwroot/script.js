
const API = "/api/leads";

const tabela = document.getElementById("leadsTabela");
const formulario = document.getElementById("leadForm");
const mensagem = document.getElementById("mensagem");


let leads = [];
let leadEditando = null;

const campo = (id) => document.getElementById(id);

async function carregarLeads() {
    try {
        const resposta = await fetch(API);

        if (!resposta.ok) {
            throw new Error("Erro ao buscar leads na API.");
        }

        leads = await resposta.json();

        renderizarLeads();
        atualizarDashboard();
        renderizarGraficos();
    } catch (erro) {
        console.error("Erro ao carregar leads:", erro);

        tabela.innerHTML = `
            <tr>
                <td colspan="5">
                    Não foi possível carregar os leads.
                    Verifique se a API está funcionando.
                </td>
            </tr>`;

        campo("totalLeads").textContent = "—";
        campo("leadsContato").textContent = "—";
        campo("leadsConvertidos").textContent = "—";
        campo("taxaConversao").textContent = "—";
    }
}

function escapar(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

function renderizarLeads() {
    const pesquisa = campo("pesquisa").value.trim().toLowerCase();
    const statusFiltro = campo("filtroStatus").value;

    const filtrados = leads.filter(lead =>
        (lead.nome || "").toLowerCase().includes(pesquisa) &&
        (!statusFiltro || lead.status === statusFiltro)
    );

    if (filtrados.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="5">Nenhum lead encontrado.</td>
            </tr>`;
        return;
    }

    tabela.innerHTML = filtrados.map(lead => `
        <tr>
            <td>${escapar(lead.nome)}</td>
            <td>${escapar(lead.telefone)}</td>
            <td>${escapar(lead.origem || "-")}</td>
            <td>
                <span class="status status-${classeStatus(lead.status)}">
                    ${escapar(lead.status)}
                </span>
            </td>
            <td>
                <button type="button" data-editar="${lead.id}">
                    Editar
                </button>
                <button type="button" class="secondary"
                    data-excluir="${lead.id}">
                    Excluir
                </button>
            </td>
        </tr>
    `).join("");
}

function classeStatus(status) {
    const classes = {
        "Novo": "novo",
        "Em contato": "contato",
        "Interessado": "interessado",
        "Convertido": "convertido",
        "Perdido": "perdido"
    };

    return classes[status] || "novo";
}

function atualizarDashboard() {
    const total = leads.length;
    const contato = leads.filter(l => l.status === "Em contato").length;
    const convertidos = leads.filter(l => l.status === "Convertido").length;
    const gestaoTotal = campo("gestaoTotal");
    const gestaoEmContato = campo("gestaoEmContato");
    const gestaoConvertidos = campo("gestaoConvertidos");

    if (gestaoTotal) gestaoTotal.textContent = total;
    if (gestaoEmContato) gestaoEmContato.textContent = contato;
    if (gestaoConvertidos) gestaoConvertidos.textContent = convertidos;

    campo("totalLeads").textContent = total;
    campo("leadsContato").textContent = contato;
    campo("leadsConvertidos").textContent = convertidos;

    campo("taxaConversao").textContent = total === 0
        ? "0%"
        : `${(convertidos / total * 100).toFixed(1)}%`;
}

function renderizarGraficos() {
    const graficoStatus = campo("graficoStatus");
    const graficoOrigem = campo("graficoOrigem");

    if (!graficoStatus || !graficoOrigem) return;

    const status = ["Novo", "Em contato", "Interessado", "Convertido", "Perdido"];

    graficoStatus.innerHTML = status.map(nome => {
        const quantidade = leads.filter(l => l.status === nome).length;
        const percentual = leads.length
            ? quantidade / leads.length * 100
            : 0;

        return `
            <div class="chart-row">
                <span class="chart-label">${escapar(nome)}</span>
                <div class="chart-track">
                    <div class="chart-bar"
                         style="width: ${percentual}%"></div>
                </div>
                <strong>${quantidade}</strong>
            </div>`;
    }).join("");

    const origens = {};

    leads.forEach(lead => {
        const origem = lead.origem?.trim() || "Não informada";
        origens[origem] = (origens[origem] || 0) + 1;
    });

    const listaOrigens = Object.entries(origens)
        .sort((a, b) => b[1] - a[1]);

    graficoOrigem.innerHTML = listaOrigens.length
        ? listaOrigens.map(([origem, quantidade]) => {
            const percentual = leads.length
                ? quantidade / leads.length * 100
                : 0;

            return `
                <div class="chart-row">
                    <span class="chart-label">${escapar(origem)}</span>
                    <div class="chart-track">
                        <div class="chart-bar"
                             style="width: ${percentual}%"></div>
                    </div>
                    <strong>${quantidade}</strong>
                </div>`;
        }).join("")
        : "<p>Nenhuma origem cadastrada.</p>";
}

function abrirFormulario(lead = null) {
    leadEditando = lead ? lead.id : null;

    // Descobre em qual página o usuário está.
    const paginaAtiva = document.querySelector(".page:not([hidden])");
    const formularioPagina = formulario.closest(".page");

    // Se o formulário estiver em outra página, mostra a página dele.
    if (formularioPagina && paginaAtiva !== formularioPagina) {
        document.querySelectorAll(".page").forEach(secao => {
            secao.hidden = secao !== formularioPagina;
        });

        document.querySelectorAll(".main-nav [data-page]").forEach(link => {
            link.classList.toggle(
                "active",
                link.dataset.page === formularioPagina.id.replace("Page", "")
            );
        });
    }

    formulario.reset();

    campo("nome").value = lead?.nome || "";
    campo("telefone").value = lead?.telefone || "";
    campo("origem").value = lead?.origem || "";
    campo("status").value = lead?.status || "Novo";

    formulario.querySelector("h2").textContent =
        lead ? "Editar lead" : "Novo lead";

    formulario.querySelector('button[type="submit"]').textContent =
        lead ? "Salvar alterações" : "Salvar lead";

    mensagem.textContent = "";
    formulario.hidden = false;

    formulario.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function fecharFormulario() {
    formulario.hidden = true;
    leadEditando = null;
    mensagem.textContent = "";
}

document.querySelectorAll(
    "#dashboardNovoLeadBtn, #listaNovoLeadBtn, #gestaoNovoLeadBtn"
).forEach(botao => {
    botao.addEventListener("click", () => abrirFormulario());
});

campo("cancelarBtn").addEventListener("click", fecharFormulario);

formulario.addEventListener("submit", async evento => {
    evento.preventDefault();

    const dados = {
        nome: campo("nome").value.trim(),
        telefone: campo("telefone").value.trim(),
        origem: campo("origem").value.trim(),
        status: campo("status").value
    };

    try {
        const resposta = await fetch(
            leadEditando === null ? API : `${API}/${leadEditando}`,
            {
                method: leadEditando === null ? "POST" : "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dados)
            }
        );

        if (!resposta.ok) {
            let erro = {};

            try {
                erro = await resposta.json();
            } catch {
                // Mantém a mensagem padrão se a API não retornar JSON.
            }

            throw new Error(erro.mensagem || "Não foi possível salvar o lead.");
        }

        fecharFormulario();
        await carregarLeads();
    } catch (erro) {
        mensagem.textContent = erro.message;
    }
});

tabela.addEventListener("click", async evento => {
    const botaoEditar = evento.target.closest("[data-editar]");
    const botaoExcluir = evento.target.closest("[data-excluir]");

    if (botaoEditar) {
        const id = Number(botaoEditar.dataset.editar);
        const lead = leads.find(l => l.id === id);

        if (lead) abrirFormulario(lead);
        return;
    }

    if (botaoExcluir) {
        const id = Number(botaoExcluir.dataset.excluir);

        if (!confirm("Deseja realmente excluir este lead?")) return;

        try {
            const resposta = await fetch(`${API}/${id}`, {
                method: "DELETE"
            });

            if (!resposta.ok) {
                throw new Error("Não foi possível excluir o lead.");
            }

            await carregarLeads();
        } catch (erro) {
            alert(erro.message);
        }
    }
});

campo("pesquisa").addEventListener("input", renderizarLeads);
campo("filtroStatus").addEventListener("change", renderizarLeads);

document.querySelectorAll(".main-nav [data-page]").forEach(link => {
    link.addEventListener("click", evento => {
        evento.preventDefault();

        const pagina = link.dataset.page;

        document.querySelectorAll(".page").forEach(secao => {
            secao.hidden = secao.id !== `${pagina}Page`;
        });

        document.querySelectorAll(".main-nav [data-page]").forEach(item => {
            item.classList.toggle("active", item === link);
        });

        const titulos = {
            dashboard: "Dashboard",
            leads: "Gestão de leads",
            historico: "Histórico"
        };

        campo("breadcrumbAtual").textContent = titulos[pagina] || "Dashboard";
    });
});

carregarLeads();
