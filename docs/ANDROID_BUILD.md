# Gerar APK / AAB Android via GitHub Actions

Este projeto vem com um workflow (`.github/workflows/android-build.yml`) que compila o app Android sem precisar instalar nada na sua máquina. A cada push na `main` (ou disparo manual) ele gera:

- **`sthmethod-debug-apk`** — APK de debug, sem assinatura, para instalar direto no celular e testar.
- **`sthmethod-release-aab`** — bundle assinado para publicar na Google Play Store.
- **`sthmethod-release-apk`** — APK assinado (útil pra distribuir fora da Play).

O build de release só roda quando os 4 secrets de assinatura estão configurados no repositório. Sem eles, você ainda recebe o APK debug.

---

## 1. Exportar o projeto para o seu GitHub

No Lovable, clique em **GitHub → Connect project** (menu "+") e crie o repositório. A partir daí, cada mudança feita aqui sincroniza pra lá e dispara o workflow.

## 2. Gerar o keystore (uma única vez)

O keystore é o arquivo que "assina" seu app e prova pra Play Store que ele é seu. Guarde bem — se perder, não conseguirá mais atualizar o app publicado.

Numa máquina qualquer com JDK instalado:

```bash
keytool -genkey -v \
  -keystore sthmethod-release.keystore \
  -alias sthmethod \
  -keyalg RSA -keysize 2048 -validity 10000
```

Ele vai perguntar:
- **senha do keystore** (guarde)
- nome, organização, cidade, país
- **senha da chave** (pode ser a mesma do keystore)

No final você tem o arquivo `sthmethod-release.keystore`.

## 3. Converter o keystore em Base64

```bash
# macOS / Linux
base64 -i sthmethod-release.keystore | pbcopy   # copia pro clipboard
# ou
base64 sthmethod-release.keystore > keystore.b64
```

```powershell
# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("sthmethod-release.keystore")) | Set-Clipboard
```

## 4. Cadastrar 4 secrets no GitHub

Repositório → **Settings → Secrets and variables → Actions → New repository secret**:

| Nome | Valor |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | conteúdo Base64 do passo 3 |
| `ANDROID_KEYSTORE_PASSWORD` | senha do keystore |
| `ANDROID_KEY_ALIAS` | `sthmethod` (o alias usado no `keytool`) |
| `ANDROID_KEY_PASSWORD` | senha da chave |

## 5. Rodar o build

- Automático: qualquer push na `main`.
- Manual: **Actions → Android Build (APK + AAB) → Run workflow**.

Quando terminar (~5-8 min), abra o run e baixe os artefatos na seção **Artifacts** no final da página.

## 6. Instalar o APK debug no celular

1. Baixe `sthmethod-debug-apk.zip`, descompacte.
2. Transfira o `.apk` pro celular (WhatsApp Web, Drive, cabo USB).
3. Toque no arquivo — o Android pede pra permitir "Instalar apps desconhecidos" pro app que você usou pra abrir. Autorize e instale.

## 7. Publicar na Play Store

1. Crie a ficha do app no [Google Play Console](https://play.google.com/console) (conta paga uma vez ~USD 25).
2. Em **Produção → Criar novo lançamento**, faça upload do `.aab` do artefato `sthmethod-release-aab`.
3. Preencha ficha, screenshots, política de privacidade e envie pra revisão.

---

## Observações

- O workflow desliga automaticamente o hot-reload do preview do Lovable (via `CAP_ENV=production`), então o APK é 100% autônomo e não depende do sandbox de preview.
- Para desenvolver e testar hot-reload em um celular real, siga o fluxo local do Capacitor (`npx cap run android`) — nesse caso, sem `CAP_ENV=production`, o app carrega do preview do Lovable.
- Não commite o keystore no repositório. Ele só existe no seu computador e nos secrets do GitHub.