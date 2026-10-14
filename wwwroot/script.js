
const API = "/api/leads";

const tabela = document.getElementById("leadsTabela");
const formulario = document.getElementById("leadForm");
const mensagem = document.getElementById("mensagem");

let leads = [];
let leadEditando = null;

async function carregarLeads() {
    try {
        const resposta = await fetch(API);

        if (!resposta.ok) {
            throw new Error("Não foi possível consultar os leads.");
        }

        leads = await resposta.json();
        renderizarLeads();
        atualizarDashboard();
    } catch (erro) {
        tabela.innerHTML =
            `<tr><td colspan="5">${erro.message}</td></tr>`;
    }
}

function renderizarLeads() {
    const busca = document.getElementById("pesquisa")
        .value.trim().toLowerCase();

    const statusFiltro =
        document.getElementById("filtroStatus").value;

    const filtrados = leads.filter(lead =>
        lead.nome.toLowerCase().includes(busca) &&
        (!statusFiltro || lead.status === statusFiltro)
    );

    if (filtrados.length === 0) {
        tabela.innerHTML =
            '<tr><td colspan="5">Nenhum lead encontrado.</td></tr>';
        return;
    }

    tabela.innerHTML = filtrados.map(lead => `
        <tr>
            <td>${escapar(lead.nome)}</td>
            <td>${escapar(lead.telefone)}</td>
            <td>${escapar(lead.origem || "-")}</td>
            <td><span class="status">${escapar(lead.status)}</span></td>
            <td>
                <button data-editar="${lead.id}">Editar</button>
                <button class="secondary" data-excluir="${lead.id}">
                    Excluir
                </button>
            </td>
        </tr>
    `).join("");
}

function escapar(valor) {
    return String(valor).replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

function atualizarDashboard() {
    const total = leads.length;
    const contato = leads.filter(l => l.status === "Em contato").length;
    const convertidos = leads.filter(l => l.status === "Convertido").length;

    document.getElementById("totalLeads").textContent = total;
    document.getElementById("leadsContato").textContent = contato;
    document.getElementById("leadsConvertidos").textContent = convertidos;

    document.getElementById("taxaConversao").textContent =
        total === 0 ? "0%" : `${(convertidos / total * 100).toFixed(1)}%`;
}

document.getElementById("novoLeadBtn").addEventListener("click", () => {
    leadEditando = null;
    formulario.reset();
    formulario.querySelector("h3").textContent = "Novo lead";
    formulario.querySelector('button[type="submit"]').textContent = "Salvar lead";
    mensagem.textContent = "";
    formulario.hidden = false;
});

document.getElementById("cancelarBtn").addEventListener("click", () => {
    formulario.hidden = true;
    leadEditando = null;
});

formulario.addEventListener("submit", async evento => {
    evento.preventDefault();

    const dados = {
        nome: document.getElementById("nome").value.trim(),
        telefone: document.getElementById("telefone").value.trim(),
        origem: document.getElementById("origem").value.trim(),
        status: document.getElementById("status").value
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
            const erro = await resposta.json();
            throw new Error(erro.mensagem || "Não foi possível salvar.");
        }

        formulario.hidden = true;
        leadEditando = null;
        await carregarLeads();
    } catch (erro) {
        mensagem.textContent = erro.message;
    }
});

tabela.addEventListener("click", async evento => {
    const editarId = evento.target.dataset.editar;
    const excluirId = evento.target.dataset.excluir;

    if (editarId) {
        const lead = leads.find(l => l.id === Number(editarId));
        if (!lead) return;

        leadEditando = lead.id;

        document.getElementById("nome").value = lead.nome;
        document.getElementById("telefone").value = lead.telefone;
        document.getElementById("origem").value = lead.origem;
        document.getElementById("status").value = lead.status;

        formulario.querySelector("h3").textContent = "Editar lead";
        formulario.querySelector('button[type="submit"]').textContent = "Salvar alterações";
        mensagem.textContent = "";
        formulario.hidden = false;
    }

    if (excluirId) {
        if (!confirm("Deseja realmente excluir este lead?")) return;

        try {
            const resposta = await fetch(`${API}/${excluirId}`, {
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

document.getElementById("pesquisa")
    .addEventListener("input", renderizarLeads);

document.getElementById("filtroStatus")
    .addEventListener("change", renderizarLeads);

carregarLeads();
