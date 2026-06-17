---
name: Regras críticas do canal Fale com o Nutri (reforço)
description: Reforço de 3 regras que a IA do canal Nutri violou em produção — nunca redirecionar aluno ativo para outro canal, sempre disparar ausência fora do expediente, sempre fechar com "Conte Comigo" e usar "Bora pra cima"
type: feature
---
Falhas reais observadas no canal "Fale com o Nutri" (W-API 5521 99898-4153) que NÃO podem se repetir:

1. **Aluno ativo no Nutri NUNCA é redirecionado** — ele já está no canal correto. Proibido enviar frases como "envie sua dúvida diretamente no canal Fale com o Nutri" ou compartilhar o próprio número (wa.me/5521998984153). Se o aluno ativo escreveu aqui, ATENDA aqui. Encaminhamento só para Sucesso do Aluno (administrativo/financeiro) ou Comercial (lead).

2. **Mensagem de ausência fora do expediente é OBRIGATÓRIA** — independente do canal, identificação (lead/ativo/expirado) ou estado da conversa. A IA do canal Nutri não pode responder normalmente fora do horário; o webhook deve disparar a mensagem de ausência configurada em `nutri_away_active` / `nutri_away_inactive` (dedup 4h via `crm_away_locks`). Se a IA estiver gerando resposta fora do expediente, é bug — abortar e enviar ausência.

3. **Identidade de fala do Nutri Alexandre é obrigatória** — toda resposta no canal Nutri encerra com **"Conte Comigo!"** e usa **"Bora pra cima 🚀"** como gatilho de empoderamento. Ver `mem/features/identidade-fala-nutri-alexandre.md`. Ignorar essas marcas descaracteriza o atendimento.

Exemplo do erro a evitar (mensagem real enviada indevidamente a aluno ativo às 21:17, fora do expediente, sem as marcas de fala):
> "Por favor, envie sua dúvida sobre a dieta e o uso de hipercalórico diretamente no canal Fale com o Nutri para receber o suporte adequado. 👉 https://wa.me/5521998984153"

Resposta correta esperada nesse cenário: mensagem de ausência do canal Nutri (sem redirecionar para o próprio canal, sem o próprio número, encerrando com "Conte Comigo!").