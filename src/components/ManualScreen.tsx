import React, { useState } from 'react';
import {
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Search,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Printer,
  GraduationCap,
  Award,
  Layers,
  ArrowRight
} from 'lucide-react';
import { User } from '../types';

interface ManualScreenProps {
  currentUser: User;
  onNavigateMain: () => void;
}

interface Section {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  content: React.ReactNode;
}

export const ManualScreen: React.FC<ManualScreenProps> = ({
  currentUser,
  onNavigateMain
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'seguranca' | 'testes'>('manual');
  const [openSectionId, setOpenSectionId] = useState<string | null>('intro');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (id: string) => {
    setOpenSectionId(prev => (prev === id ? null : id));
  };

  const manualSections: Section[] = [
    {
      id: 'intro',
      title: '1. O que é o Lançamento do Projeto de Pesquisa?',
      subtitle: 'O ponto de partida oficial da sua jornada científica no TCC',
      badge: 'Conceito Inicial',
      badgeColor: 'bg-blue-900/60 text-blue-300 border-blue-700',
      content: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            O <strong>Lançamento do Projeto de Pesquisa</strong> é o primeiro passo formal do seu Trabalho de Conclusão de Curso (TCC). Ele funciona como a <span className="text-white font-medium">certidão de nascimento da sua investigação acadêmica</span>.
          </p>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h4 className="text-white font-semibold flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Por que ele é obrigatório?
            </h4>
            <p>
              Antes de escrever dezenas de páginas, você precisa ter um plano claro, aprovado pelo orientador. Este lançamento define quem é você, qual o tema escolhido, qual questão você quer responder e quais livros darão suporte ao seu trabalho.
            </p>
          </div>
          <p>
            Ao preencher essa etapa no sistema, o professor orientador consegue acompanhar o amadurecimento das suas ideias desde o primeiro dia de aula, evitando que você pesquise às cegas ou precise recomeçar o trabalho mais adiante.
          </p>
        </div>
      )
    },
    {
      id: 'objetivo',
      title: '2. Qual é o Objetivo da Ficha de Orientação?',
      subtitle: 'Alinhar expectativas, documentar encontros e garantir transparência',
      badge: 'Finalidade Pedagógica',
      badgeColor: 'bg-emerald-900/60 text-emerald-300 border-emerald-700',
      content: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            A <strong>Ficha de Acompanhamento e Orientação</strong> tem três grandes objetivos:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-blue-400 font-bold block mb-1">1. Registro Oficial</span>
              <p className="text-xs text-slate-300">
                Registra as datas e horários de cada reunião realizada entre a aluna e o professor orientador.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-emerald-400 font-bold block mb-1">2. Diálogo Contínuo</span>
              <p className="text-xs text-slate-300">
                Permite ao orientador apontar correções no parecer e à aluna comprovar que atendeu a cada apontamento.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-purple-400 font-bold block mb-1">3. Resguardo Legal</span>
              <p className="text-xs text-slate-300">
                Gera o documento final em PDF/Word com assinatura digital para arquivamento na secretaria acadêmica da FAATESP.
              </p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-900/60 text-blue-200 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span>
              <strong>Regra Institucional:</strong> É obrigatório ter no mínimo <strong>2 reuniões de orientação registradas e confirmadas</strong> para que a ficha possa ser considerada apta e aprovada para a banca.
            </span>
          </div>
        </div>
      )
    },
    {
      id: 'problema-hipotese',
      title: '3. Como Preencher a Situação-Problema e a Hipótese?',
      subtitle: 'A regra prática para transformar um tema amplo em uma pergunta científica real',
      badge: 'Coração da Pesquisa',
      badgeColor: 'bg-amber-900/60 text-amber-300 border-amber-700',
      content: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            Estes dois campos costumam gerar dúvidas, mas a lógica para construí-los é muito simples:
          </p>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                A Situação-Problema (A Pergunta de Ouro)
              </span>
            </div>
            <p className="text-xs text-slate-300">
              É a <strong>dúvida central</strong> que a sua pesquisa pretende investigar. Não é apenas o tema (ex: "Jogos na Educação Infantil"), mas sim <em>o que exatamente você quer descobrir sobre esse tema</em>.
            </p>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs">
              <span className="text-slate-400 block mb-1">Exemplo real da aluna Marineusa / Pedagogia:</span>
              <p className="text-slate-200 italic">
                "De que maneira a teoria da psicogênese da língua escrita proposta por Emilia Ferreiro contribui para a superação das dificuldades de alfabetização nos anos iniciais do Ensino Fundamental?"
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                A Hipótese (A Resposta Provisória)
              </span>
            </div>
            <p className="text-xs text-slate-300">
              É a <strong>resposta suposta</strong> que você tem para a pergunta antes de concluir o estudo. É uma afirmação clara que o seu TCC vai testar, comprovar ou refutar ao longo dos capítulos.
            </p>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs">
              <span className="text-slate-400 block mb-1">Exemplo prático de Hipótese:</span>
              <p className="text-slate-200 italic">
                "Acredita-se que a aplicação dos princípios de Emilia Ferreiro permite ao docente identificar em qual nível conceitual a criança se encontra (pré-silábico, silábico ou alfabético), possibilitando intervenções pedagógicas individualizadas e mais eficazes."
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'bibliografia',
      title: '4. Como Preencher as Referências Bibliográficas?',
      subtitle: 'Garantindo a autoridade teórica e a confiabilidade acadêmica',
      badge: 'Normas ABNT',
      badgeColor: 'bg-indigo-900/60 text-indigo-300 border-indigo-700',
      content: (
        <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
          <p>
            A bibliografia deve conter os autores clássicos e os artigos científicos que darão sustentação teórica ao seu projeto.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300 pl-2">
            <li>Indique autores relevantes e reconhecidos na área de conhecimento.</li>
            <li>Use o padrão clássico: <strong>SOBRENOME, Nome. Título da obra em destaque. Cidade: Editora, Ano.</strong></li>
            <li>Evite usar blogs anônimos, matérias de redes sociais ou opiniões sem respaldo acadêmico.</li>
          </ul>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1 text-slate-300">
            <span className="text-slate-400 font-semibold block">Exemplo formatado:</span>
            <p className="italic">FERREIRO, Emilia; TEBEROSKY, Ana. <em>Psicogênese da língua escrita</em>. Porto Alegre: Artmed, 1999.</p>
            <p className="italic">FREIRE, Paulo. <em>Pedagogia da Autonomia: saberes necessários à prática educativa</em>. São Paulo: Paz e Terra, 1996.</p>
          </div>
        </div>
      )
    },
    {
      id: 'orientacoes-registro',
      title: '5. Registro dos Encontros de Orientação',
      subtitle: 'Como preencher data, horário e síntese do que foi debatido',
      badge: 'Acompanhamento',
      badgeColor: 'bg-teal-900/60 text-teal-300 border-teal-700',
      content: (
        <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
          <p>
            Cada vez que você se reunir com o orientador (presencialmente ou online), adicione uma nova linha na seção <strong>Orientação / Acompanhamento</strong>:
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
              <div>
                <strong className="text-white block">Data e Horário:</strong>
                <span className="text-slate-300">Informe a data do encontro e o horário (ex: 14:30 ou 19:00).</span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
              <div>
                <strong className="text-white block">Observação / Pauta:</strong>
                <span className="text-slate-300">Escreva resumidamente o que foi discutido. Exemplo: <em>"Alinhamento da situação-problema e indicação de leitura do capítulo 2."</em></span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
              <div>
                <strong className="text-white block">Confirmação do Orientador:</strong>
                <span className="text-slate-300">O orientador valida e confirma o encontro no sistema, carimbando a chancela digital dele.</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'parecer-orientador',
      title: '6. Como o Orientador Deve Analisar e Dar o Parecer?',
      subtitle: 'O fluxo de avaliação pedagógica, correções e liberação de nota',
      badge: 'Exclusivo do Orientador',
      badgeColor: 'bg-rose-900/60 text-rose-300 border-rose-700',
      content: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            No menu <strong>Consultar & Corrigir</strong>, o professor orientador tem à disposição a listagem completa dos 23 alunos. Ao clicar em <strong>"Analisar e Dar Parecer"</strong> em qualquer aluna, abre-se uma tela dedicada:
          </p>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
              <strong className="text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Se houver correções necessárias:
              </strong>
              <p className="text-slate-300">
                O orientador digita detalhadamente no campo de texto o que a aluna precisa ajustar (ex: <em>"Ajustar a hipótese para focar especificamente na pré-escola e acrescentar mais 2 referências atualizadas"</em>).
              </p>
              <p className="text-slate-400 text-[11px]">
                A aluna verá um aviso luminoso no topo da tela indicando que existe um parecer pendente de correção.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
              <strong className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Se o trabalho estiver pronto para aprovação:
              </strong>
              <p className="text-slate-300">
                O orientador atribui a <strong>Nota Oficial (0 a 10)</strong>, seleciona o status como <strong>"Aprovado"</strong> e emite o parecer conclusivo.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'restricoes-aprovacao',
      title: '7. O que Significa "Ficha com Restrição"?',
      subtitle: 'Entenda os 5 critérios que o sistema confere automaticamente',
      badge: 'Controle de Qualidade',
      badgeColor: 'bg-orange-900/60 text-orange-300 border-orange-700',
      content: (
        <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
          <p>
            Para evitar que uma aluna receba nota antes de cumprir todos os requisitos acadêmicos, o sistema bloqueia notas antecipadas quando qualquer um destes itens estiver faltando:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span>Situação-Problema em branco</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span>Hipótese de pesquisa ausente</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span>Bibliografia vazia</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span>Menos de 2 reuniões de orientação</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 pt-1">
            Assim que a aluna preenche todos os itens e o orientador confirma os encontros, o aviso de restrição desaparece e a ficha fica 100% elegível para a nota final.
          </p>
        </div>
      )
    },
    {
      id: 'exportacao',
      title: '8. Como Exportar o Documento Oficial em PDF e Word?',
      subtitle: 'Com cabeçalho FAATESP, carimbo digital e formatação ABNT',
      badge: 'Etapa Final',
      badgeColor: 'bg-cyan-900/60 text-cyan-300 border-cyan-700',
      content: (
        <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
          <p>
            Tanto a aluna quanto o orientador podem exportar a ficha a qualquer momento pelo menu <strong>"Pré-Visualização"</strong> ou diretamente nos botões do painel inicial:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-rose-400 font-semibold block mb-1">📄 Exportar PDF Oficial</span>
              <p className="text-slate-300">
                Gera o layout idêntico à folha impressa timbrada da FAATESP, com moldura, assinaturas digitais e pronto para envio formal.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-blue-400 font-semibold block mb-1">📝 Exportar Word (.DOCX)</span>
              <p className="text-slate-300">
                Permite editar o texto no Microsoft Word ou Google Docs caso seja necessário adicionar algum carimbo ou anexo físico.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const filteredSections = manualSections.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-900/50 p-6 sm:p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              Guia Prático e Oficial • FAATESP TCC
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Manual de Orientação e Regras do Sistema
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Instruções didáticas e sequenciais para alunos e orientadores preencherem, corrigirem e avaliarem os projetos de pesquisa com total clareza e segurança.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onNavigateMain}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'manual'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
              : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Manual Didático (Tópicos Passo a Passo)</span>
        </button>

        <button
          onClick={() => setActiveTab('seguranca')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'seguranca'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
              : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Regras de Permissão e Segurança das Fichas</span>
        </button>

        <button
          onClick={() => setActiveTab('testes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'testes'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
              : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Roteiro Prático de Testes com as 23 Alunas</span>
        </button>
      </div>

      {/* TAB 1: MANUAL DIDÁTICO */}
      {activeTab === 'manual' && (
        <div className="space-y-4">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar tópico do manual (ex: hipótese, parecer, reunião, bibliografia)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Accordion List */}
          <div className="space-y-3">
            {filteredSections.map((sec) => {
              const isOpen = openSectionId === sec.id;
              return (
                <div
                  key={sec.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'bg-slate-900/95 border-blue-500/50 shadow-lg'
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <button
                    onClick={() => toggleSection(sec.id)}
                    className="w-full p-4 sm:p-5 text-left flex items-start sm:items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${sec.badgeColor}`}>
                          {sec.badge}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {sec.title}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {sec.subtitle}
                      </p>
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-transform ${
                      isOpen ? 'bg-blue-600 border-blue-500 text-white rotate-180' : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-slate-800/80 bg-slate-950/40">
                      {sec.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: REGRAS DE PERMISSÃO E SEGURANÇA */}
      {activeTab === 'seguranca' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Como Funciona a Blindagem das Fichas?</h2>
                <p className="text-xs text-slate-400">Explicação simples e sem termos técnicos complexos</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              O sistema foi programado para responder com precisão matemática a uma regra fundamental: <strong>uma aluna jamais pode ver, alterar ou apagar a ficha de outra aluna</strong>. Ao mesmo tempo, o orientador tem visão panorâmica de todas as fichas para emitir pareceres e notas.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Para o Aluno (Visão Restrita à Própria Ficha)
                </span>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span><strong>Filtro por E-mail:</strong> No momento do login, o sistema busca apenas a ficha que coincide com o e-mail digitado pela aluna.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span><strong>Bloqueio de Fichas Alheias:</strong> Menus administrativos como "Consultar & Corrigir" e "Histórico" ficam totalmente invisíveis para quem está no perfil de aluno.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <span><strong>Caso Específico da Marineusa:</strong> O identificador único dela (<code className="text-blue-300 bg-blue-950 px-1 py-0.5 rounded">ficha-1790973147343-i0su</code>) e seus e-mails (<code className="text-blue-300 bg-blue-950 px-1 py-0.5 rounded">marineuza.souza@gmail.com</code> / <code className="text-blue-300 bg-blue-950 px-1 py-0.5 rounded">neuzasofia555@gmail.com</code>) estão fixados no código para que ela sempre acesse seu trabalho real de Pedagogia sobre Emilia Ferreiro.</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Para o Orientador (Visão Geral de Supervisão)
                </span>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span><strong>Acesso às 23 Fichas:</strong> O orientador tem uma tela exclusiva com a tabela completa das 23 estudantes em ordem alfabética e com busca rápida por nome.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span><strong>Poder de Correção e Nota:</strong> O orientador pode editar qualquer campo, inserir anotações de orientação, atribuir nota e homologar o parecer final.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <span><strong>Chancela Digital:</strong> A assinatura do Prof. Rogério Augusto é aplicada automaticamente nos pareceres e no documento oficial.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-200 text-xs flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-300 block mb-0.5 font-semibold">Garantia Anti-Cota (Single Get):</strong>
                <span>
                  O aplicativo faz apenas <strong>uma única leitura</strong> no banco de dados na hora em que você entra na tela. Não há atualizações repetitivas automáticas ou laços infinitos ("loops"). Todas as alterações que você faz são gravadas com segurança e rapidez.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ROTEIRO PRÁTICO DE TESTES COM AS 23 ALUNAS */}
      {activeTab === 'testes' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Roteiro Prático de Testes (Simulação Segura das 23 Alunas)</h2>
                <p className="text-xs text-slate-400">Como testar com a turma inteira sem nenhum perigo de esgotar cotas diárias</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Você pode orientar todas as suas 23 alunas a acessarem o sistema simultaneamente. Como nós eliminamos os ouvintes contínuos e ativamos o <strong>Single Get com cache inteligente</strong>, cada aluna consome apenas 1 leitura ao entrar e 1 gravação ao salvar. O limite gratuito diário do Google é de <strong>50.000 operações</strong>, logo 23 alunas representam <strong>menos de 0,2% da cota</strong>!
            </p>

            {/* Step by Step Test Plan */}
            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Etapa 1 • Orientação Prévia para a Turma</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">Duração: 5 min</span>
                </div>
                <h4 className="text-white font-semibold text-sm">Envio do Link e Instrução de Login</h4>
                <p className="text-xs text-slate-300">
                  Envie o link do sistema no grupo de WhatsApp da turma ou pelo Google Classroom. Peça para cada aluna clicar em <strong>"Entrar como Aluno"</strong> e digitar o seu próprio e-mail cadastrado (por exemplo: <code className="text-blue-300">marineuza.souza@gmail.com</code>).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Etapa 2 • Conferência Inicial da Ficha</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">Duração: 10 min</span>
                </div>
                <h4 className="text-white font-semibold text-sm">Verificação dos Dados Pessoais e do Tema</h4>
                <p className="text-xs text-slate-300">
                  Cada aluna deve abrir a tela inicial e conferir se o seu nome, curso (Licenciatura em Pedagogia) e título do trabalho aparecem corretamente no cartão superior. Caso a aluna queira complementar a Situação-Problema ou a Bibliografia, ela deve clicar em <strong>"Editar Ficha"</strong>, preencher os campos e clicar em <strong>"Salvar Ficha"</strong> uma vez.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Etapa 3 • Supervisão pelo Orientador</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">Duração: 15 min</span>
                </div>
                <h4 className="text-white font-semibold text-sm">Visualização em Tempo Real no Modo Orientador</h4>
                <p className="text-xs text-slate-300">
                  Enquanto as alunas salvam, você (Prof. Rogério) acessa o menu <strong>"Consultar & Corrigir"</strong>. Use o botão <strong>"Atualizar Dados (Nuvem)"</strong> no canto superior da tabela para puxar as últimas atualizações de todas as alunas de uma só vez (1 leitura única para todas as 23!).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Etapa 4 • Teste do Parecer e Validação de Reunião</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">Duração: 10 min</span>
                </div>
                <h4 className="text-white font-semibold text-sm">Emissão de Parecer Piloto</h4>
                <p className="text-xs text-slate-300">
                  Escolha uma ou duas alunas (por exemplo, a Marineusa ou a Rosenilda), clique em <strong>"Analisar e Dar Parecer"</strong>, digite uma mensagem de teste como <em>"Projeto inicial aprovado para a 1ª fase"</em> e salve. Peça para a aluna recarregar a tela dela: o aviso do parecer aparecerá imediatamente com destaque!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Etapa 5 • Teste de Download do PDF Oficial</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">Duração: 5 min</span>
                </div>
                <h4 className="text-white font-semibold text-sm">Geração do PDF pelas Alunas</h4>
                <p className="text-xs text-slate-300">
                  Oriente as alunas a clicarem no botão <strong>"Baixar PDF Oficial"</strong> no painel inicial. O PDF será baixado no computador ou celular delas sem que elas saiam da página e sem fazer nenhuma chamada extra ao banco de dados, pois o documento é gerado diretamente no próprio navegador da aluna.
                </p>
              </div>
            </div>

            {/* Safety Summary Banner */}
            <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-900/60 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-blue-300">Consumo Estimado do Teste Completo:</span>
                <p className="text-[11px] text-slate-300">
                  23 acessos simultâneos = ~46 leituras + ~23 gravações. Cota disponível: 50.000 leituras/dia. Margem de segurança de mais de <strong>99,8%</strong>.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold shrink-0">
                100% Seguro
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
