---
name: Arquitetura unificada de dados do ecossistema STH METHOD
description: Todo módulo (STH AI, CAS, Coach, portal) grava no banco único do STH METHOD — cadastro mestre único por user_id, histórico compartilhado, sem APIs entre sistemas.
type: feature
---
Princípio: o STH AI (e qualquer outra ferramenta) é módulo do ecossistema, não sistema independente. Não criar bancos, cadastros ou históricos paralelos.

- **Cadastro mestre**: `public.profiles` (chave `user_id` de auth.users). `ai_app_profiles` é apenas a ficha operacional do módulo AI e é sincronizada nos dois sentidos por triggers nativos `sync_ai_profile_to_master` e `sync_master_to_ai_profile` (nome, sexo, peso, altura, objetivo, nível de treino, idade/birth_date). Se o aluno nasce no STH AI, o profile mestre é criado automaticamente.
- **Dados compartilhados**: cadastro, anamnese, objetivos, histórico clínico, dietas, treinos, protocolos, análises/exames, avaliações e imagens corporais (`body_images`), arquivos, documentos, conversas, uso de IA, evolução, indicadores, preferências e auditoria.
- **Imagens corporais**: parte do prontuário, gerenciadas por admin/consultor; o aluno registra pelo STH AI em `/ai/app/imagens` usando a MESMA tabela `body_images` e bucket `body-images`.
- **Continuidade**: aluno que migra AI → acompanhamento (ou vice-versa) mantém o mesmo cadastro e histórico, sem duplicidade.
- Ao criar qualquer novo módulo/ferramenta, gravar sempre nas tabelas existentes do ecossistema, referenciando `user_id`; nunca duplicar cadastro.
