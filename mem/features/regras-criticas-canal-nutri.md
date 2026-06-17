---
name: Regras críticas do canal Fale com o Nutri (reforço)
description: Reforço de regras que a IA do canal Nutri violou em produção — nunca redirecionar aluno ativo, sempre disparar ausência fora do expediente, sempre fechar com "Conte Comigo" e usar "Bora pra cima", e NUNCA usar o próprio número do canal como redirecionamento
type: feature
---
Falhas reais observadas no canal "Fale com o Nutri" (W-API 5521 99898-4153) que NÃO podem se repetir:

1. **Aluno ativo no Nutri NUNCA é redirecionado** — ele já está no canal correto. Proibido enviar frases como "envie sua dúvida diretamente no canal Fale com o Nutri" ou compartilhar o próprio número (wa.me/5521998984153). Se o aluno ativo escreveu aqui, ATENDA aqui. Encaminhamento só para Sucesso do Aluno (administrativo/financeiro) ou Comercial (lead).

2. **NÚMERO DO PRÓPRIO CANAL: 21998984153 / +55 21 99898-4153** — Este é o número do canal "Fale com o Nutri". NUNCA redirecionar um aluno ativo para este número. NUNCA enviar link wa.me/5521998984153 para alunos que já estão falando neste canal. O aluno já está conversando neste número; redirecioná-lo para o mesmo número é absurdo e gera confusão.

3. **Mensagem de ausência fora do expediente é OBRIGATÓRIA** — independente do canal, identificação (lead/ativo/expirado) ou estado da conversa. A IA do canal Nutri não pode responder normalmente fora do horário; o webhook deve disparar a mensagem de ausência configurada em `nutri_away_active` / `nutri_away_inactive` (dedup 4h via `crm_away_locks`). Se a IA estiver gerando resposta fora do expediente, é bug — abortar e enviar ausência.

4. **Identidade de fala do Nutri Alexandre é obrigatória** — toda resposta no canal Nutri encerra com **"Conte Comigo!"** e usa **"Bora pra cima 🚀"** como gatilho de empoderamento. Ver `mem/features/identidade-fala-nutri-alexandre.md`. Ignorar essas marcas descaracteriza o atendimento.

5. **Dados do aluno vão SEMPRE para a plataforma sthmethod.com.br** — fotos de evolução, alteração de peso/medidas/NEAT, exames laboratoriais e documentos clínicos devem ser inseridos pelo aluno na área logada de `sthmethod.com.br`. Nunca solicitar nem aceitar esses dados pelo WhatsApp; sempre orientar o caminho na plataforma.

6. **Roteamento "Fale com o Nutri" exige aluno ativo** — quando uma conversa em outro canal (Comercial / Sucesso do Aluno) não tiver entendimento claro (ex.: dúvidas de rotina, dieta, treino, protocolo), antes de encaminhar para o Fale com o Nutri **verificar se o contato é aluno ativo**. Se ativo → encaminhar para Fale com o Nutri. Se não for aluno ativo → NÃO encaminhar; tratar no próprio canal (lead vai para Comercial, financeiro para Sucesso do Aluno). E, reforçando a regra 1: se a conversa já está no próprio canal Nutri, atender ali — nunca redirecionar para si mesmo.

Exemplo do erro a evitar (mensagem real enviada indevidamente a aluno ativo às 21:17, fora do expediente, sem as marcas de fala, redirecionando para o próprio número do canal):
> "Por favor, envie sua dúvida sobre a dieta e o uso de hipercalórico diretamente no canal Fale com o Nutri para receber o suporte adequado. 👉 https://wa.me/5521998984153"

Resposta correta esperada nesse cenário: mensagem de ausência do canal Nutri (sem redirecionar para o próprio canal, sem o próprio número, encerrando com "Conte Comigo!").
