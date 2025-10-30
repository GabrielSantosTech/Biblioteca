document.addEventListener('DOMContentLoaded', () => {

    const loginContainer = document.getElementById('login-container');
    const biblioteca = document.getElementById('biblioteca');
    const mensagem = document.getElementById('mensagem');
    const btnLogin = document.getElementById('btn-login');
    const btnRegistrar = document.getElementById('btn-registrar');
    const livros = document.querySelectorAll('.livros');
    const btnSair = document.getElementById('btn-sair');
    const nomeUsuarioSpan = document.getElementById('nome-usuario');
    const horaDataSpan = document.getElementById('hora-data');
    const modoBtn = document.getElementById('modo-escuro');
    const adminArea = document.getElementById('admin-area');
    const buscaAluno = document.getElementById('busca-aluno');
    const listaAlunos = document.getElementById('lista-alunos');
    const perfilAluno = document.getElementById('perfil-aluno');
    const perfilNome = document.getElementById('perfil-nome');
    const perfilSerie = document.getElementById('perfil-serie');
    const perfilLivros = document.getElementById('perfil-livros');
    const perfilAtividades = document.getElementById('perfil-atividades');
    const voltarLista = document.getElementById('voltar-lista');
    const atividadesAlunoDiv = document.getElementById('atividades-aluno');
    const listaAtividades = document.getElementById('lista-atividades');

    let leitura = {};

    function mostrarUsuario(){
        const usuario = localStorage.getItem('usuarioLogado');
        if(usuario) nomeUsuarioSpan.textContent=usuario;
    }

    function atualizarHora(){
        setInterval(()=>{
            horaDataSpan.textContent = new Date().toLocaleString('pt-BR',{hour12:false});
        },1000);
    }

    function formatarTempo(seg){ const h=Math.floor(seg/3600), m=Math.floor((seg%3600)/60), s=seg%60; return `${h>0?h+'h ':''}${m>0?m+'m ':''}${s}s`; }

    function atualizarTempos(){
        const usuario = localStorage.getItem('usuarioLogado');
        const progresso = JSON.parse(localStorage.getItem('progresso_'+usuario)||'{}');
        livros.forEach(l=>{
            const id=l.querySelector('h3').textContent;
            l.querySelector('.tempo-lido').textContent='Tempo lido: '+formatarTempo(progresso[id]||0);
        });
    }

// ===== Registro =====
    btnRegistrar.addEventListener('click',()=>{
        const usuario = document.getElementById('reg-usuario').value.trim();
        const senha = document.getElementById('reg-senha').value.trim();
        const serie = document.getElementById('reg-serie').value;
        if(usuario && senha && serie){
            if(localStorage.getItem('usuario_'+usuario)) mensagem.textContent='Usuário já existe!';
            else {
                const dados = {senha:senha, serie:serie, notas:{}, atividades:[]};
                localStorage.setItem('usuario_'+usuario,JSON.stringify(dados));
                mensagem.textContent='Registrado com sucesso!';
            }
        } else mensagem.textContent='Preencha todos os campos!';
    });

// ===== Login =====
    btnLogin.addEventListener('click',()=>{
        const usuario = document.getElementById('login-usuario').value.trim();
        const senha = document.getElementById('login-senha').value.trim();
        const dadosStr = localStorage.getItem('usuario_'+usuario);
        if(dadosStr){
            const dados = JSON.parse(dadosStr);
            if(dados.senha===senha){
                localStorage.setItem('usuarioLogado',usuario);
                loginContainer.style.display='none';
                biblioteca.style.display='block';
                mostrarUsuario();
                atualizarHora();
                mostrarAdmin(usuario);
                atualizarTempos();
                mostrarAtividadesAluno(usuario);
            } else mensagem.textContent='Senha incorreta!';
        } else mensagem.textContent='Usuário não existe!';
    });

// ===== Logout =====
    btnSair.addEventListener('click',()=>{
        localStorage.removeItem('usuarioLogado');
        loginContainer.style.display='block';
        biblioteca.style.display='none';
    });

// ===== Modo escuro =====
    modoBtn.addEventListener('click',()=>document.body.classList.toggle('dark-mode'));

// ===== Filtros =====
    document.querySelectorAll('.filtros button').forEach(btn=>{
        btn.addEventListener('click',()=>{
            const cat = btn.getAttribute('data-categoria');
            livros.forEach(l=>{
                const lc = l.getAttribute('data-categoria');
                l.style.display=(cat==='todos'||lc===cat)?'block':'none';
            });
        });
    });

// ===== Abrir PDF e contar tempo =====
    livros.forEach(l=>{
        l.addEventListener('click',()=>{
            const usuario = localStorage.getItem('usuarioLogado');
            if(!usuario) return;
            const livroId = l.querySelector('h3').textContent;
            const link = l.getAttribute('data-link');
            if(!leitura[livroId]) leitura[livroId]=0;
            const start = Date.now();
            const pdfWindow = window.open(link,'_blank');
            const timer = setInterval(()=>{
                if(pdfWindow.closed){
                    clearInterval(timer);
                    const tempo = Math.floor((Date.now()-start)/1000);
                    leitura[livroId]+=(tempo);
                    const prog = JSON.parse(localStorage.getItem('progresso_'+usuario)||'{}');
                    prog[livroId] = (prog[livroId]||0)+leitura[livroId];
                    localStorage.setItem('progresso_'+usuario,JSON.stringify(prog));
                    atualizarTempos();
                }
            },1000);
        });
    });

// ===== ADMIN AREA =====
    function mostrarAdmin(usuario){
        if(usuario.toLowerCase().includes('prof') && JSON.parse(localStorage.getItem('usuario_'+usuario)).senha.includes('gst')){
            adminArea.style.display='block';
            listarAlunos();
        } else adminArea.style.display='none';
    }

    function listarAlunos(){
        listaAlunos.innerHTML='';
        for(let i=0;i<localStorage.length;i++){
            const key=localStorage.key(i);
            if(key.startsWith('usuario_')){
                const nome=key.replace('usuario_','');
                if(!nome.toLowerCase().includes('prof')){
                    const div=document.createElement('div');
                    div.textContent=`${nome} | Série: ${JSON.parse(localStorage.getItem(key)).serie}`;
                    div.addEventListener('click',()=>abrirPerfilAluno(nome));
                    listaAlunos.appendChild(div);
                }
            }
        }
    }

// ===== PERFIL ALUNO =====
    function abrirPerfilAluno(nome){
        listaAlunos.style.display='none';
        perfilAluno.style.display='block';
        const dados = JSON.parse(localStorage.getItem('usuario_'+nome));
        perfilNome.textContent = nome;
        perfilSerie.textContent = "Série: "+dados.serie;

        // Livros
        perfilLivros.innerHTML='';
        const prog = JSON.parse(localStorage.getItem('progresso_'+nome)||'{}');
        for(const livro in prog){
            const div = document.createElement('div');
            div.textContent=`${livro}: ${formatarTempo(prog[livro])}`;
            perfilLivros.appendChild(div);
        }

        // Atividades
        perfilAtividades.innerHTML='';
        dados.atividades.forEach((atv,idx)=>{
            const div = document.createElement('div');
            div.textContent=`Livro: ${atv.livro} | Questões: ${atv.perguntas.length} | Professor: ${atv.professor}`;
            perfilAtividades.appendChild(div);
        });
    }

    voltarLista.addEventListener('click',()=>{
        perfilAluno.style.display='none';
        listaAlunos.style.display='block';
    });

// ===== ATIVIDADES DO ALUNO =====
    function mostrarAtividadesAluno(usuario){
        const dados = JSON.parse(localStorage.getItem('usuario_'+usuario));
        listaAtividades.innerHTML='';
        dados.atividades.forEach((atv,idx)=>{
            if(!atv.entregue){
                const div = document.createElement('div');
                div.innerHTML=`Livro: ${atv.livro} | Questões: ${atv.perguntas.length} <button id="responder${idx}">Responder</button>`;
                listaAtividades.appendChild(div);
                document.getElementById(`responder${idx}`).addEventListener('click',()=>{
                    responderAtividade(usuario,idx);
                });
            }
        });
        if(dados.atividades.length>0) atividadesAlunoDiv.style.display='block';
    }

    function responderAtividade(usuario,idx){
        const dados = JSON.parse(localStorage.getItem('usuario_'+usuario));
        const atv = dados.atividades[idx];
        atv.perguntas.forEach((q,qi)=>{
            const resp = prompt(`Livro: ${atv.livro}\n${q.questao} (valendo ${q.pontos} pts)`);
            if(resp!==null) q.resposta=resp;
        });
        atv.entregue=true;
        localStorage.setItem('usuario_'+usuario,JSON.stringify(dados));
        mostrarAtividadesAluno(usuario);
    }
// ===== Verificar se já há usuário logado ao carregar =====
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (usuarioLogado) {
        loginContainer.style.display = 'none';
        biblioteca.style.display = 'block';
        mostrarUsuario();
        atualizarHora();
        mostrarAdmin(usuarioLogado);
        atualizarTempos();
        mostrarAtividadesAluno(usuarioLogado);
    }

});
