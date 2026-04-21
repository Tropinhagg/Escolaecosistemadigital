# 🐾 Tropinha

Plataforma educacional privada para turma de estudos. Centraliza mural de avisos, conteúdo de estudo, simulados com fiscalização e materiais.

## Stack

| Camada | Tecnologia |
|---|---|
| Front-end | HTML + CSS + JS puro (`<script type="module">`) |
| Back-end / Auth | [Supabase](https://supabase.com) |
| Banco de imagens | [Cloudinary](https://cloudinary.com) |
| Hospedagem | GitHub Pages via GitHub Actions |

## Estrutura do repositório

```
tropinha/
├── .github/workflows/deploy.yml   # Deploy automático no push para main
├── public/
│   ├── images/                    # Imagens estáticas locais
│   └── favicon.ico
├── .env.example                   # Referência de variáveis (nunca commitar o .env real)
├── README.md
└── index.html                     # Toda a aplicação — SPA autocontida
```

## Configuração

1. Clone o repositório.
2. Copie `.env.example` como referência — **não crie um `.env` real commitado**.
3. No `index.html`, preencha as constantes no topo do `<script>`:

```js
const SUPABASE_URL     = 'https://xxxx.supabase.co';
const SUPABASE_ANON    = 'sb_publishable_...';
const CLOUDINARY_CLOUD = 'nome-do-cloud';
const CLOUDINARY_PRESET= 'preset-nao-assinado';
const EMAIL_DOMAIN     = '@tropinha.local';
```

4. No painel do GitHub, vá em **Settings → Pages** e configure a **Source** como **GitHub Actions**.
5. Qualquer push no branch `main` dispara o deploy automaticamente.

## Schema do banco (Supabase)

Execute as migrações na ordem abaixo no SQL Editor do Supabase. O schema completo está na especificação do projeto (`tropinha_prompt_spec.md`). As tabelas principais são:

- `usuarios` — identidade dos usuários (espelha `auth.users`)
- `publicacoes` — posts do mural
- `reacoes` — curtidas em publicações
- `comentarios` — threads de comentários
- `curtidas_comentario` — curtidas em comentários
- `compartilhamentos` — registro de compartilhamentos
- `materiais` — links externos (PDFs, editais, vídeos…)
- `simulados` — metadados dos simulados
- `questoes` — perguntas dos simulados
- `tentativas_simulado` — progresso de cada aluno
- `logs` — auditoria imutável
- `conteudo_abas` — blocos de conteúdo rico (Edital, Assuntos, Vídeos…)
- `materias` — agrupamento de simulados por disciplina
- `sim_arquivos` — arquivos vinculados a simulados

**Importante:** habilite RLS em todas as tabelas antes de criar as policies. A função `meu_role()` deve ser criada com `SECURITY DEFINER` para evitar recursão circular nas policies.

## Roles de usuário

| Role | Permissões |
|---|---|
| `aluno` | Lê conteúdo, faz simulados, reage e comenta |
| `professor` | Tudo do aluno + publica no mural, gerencia conteúdo e materiais |
| `admin` | Controle total, incluindo criar usuários e resetar tentativas |

## Criando usuários

Como o site é privado, usuários são criados pelo admin diretamente no painel do Supabase (Authentication → Users), usando o e-mail no formato `apelido@tropinha.local` (ou o `EMAIL_DOMAIN` configurado). Após criar o usuário no Auth, insira a linha correspondente em `public.usuarios` com `apelido`, `nome` e `role`.

## Regras importantes

- **Nunca** envie chaves secretas para o repositório. Apenas `SUPABASE_ANON` e o preset não-assinado do Cloudinary são seguros no front-end.
- **Nunca** armazene imagens em base64 no banco. Todas as imagens passam pelo Cloudinary.
- Todo conteúdo do banco passa pela função `esc()` antes de qualquer `innerHTML` para prevenir XSS.
- Toda nova tabela precisa de RLS habilitado + policies antes de entrar em produção.

## Desenvolvimento local

Abra `index.html` diretamente no navegador ou use um servidor estático simples:

```bash
npx serve .
# ou
python3 -m http.server 3000
```

## Deploy

O deploy é 100% automático via GitHub Actions. Basta fazer push para `main`. O workflow `.github/workflows/deploy.yml` faz o checkout e publica a raiz do repositório no GitHub Pages usando `peaceiris/actions-gh-pages@v3`.

**Nunca habilite** o deploy direto por branch nas configurações do GitHub Pages — isso criaria dois caminhos de deploy concorrentes.
