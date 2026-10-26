# Mimo Pet

Landing page demonstrativa de banho, tosa e cuidados para cães e gatos, construída
com HTML, CSS e JavaScript. As quatro referências formam uma página contínua:
hero e benefícios, serviços e sobre, galeria e agendamento, contato e rodapé.

O site inclui navegação responsiva, galeria ampliada, seleção de serviços e uma
prévia editável da mensagem de contato. Fontes e fotografias são servidas localmente.

## Prévia local no Windows

Requer Node.js **22.12 ou superior** para o kit de desenvolvimento. O site publicado
não precisa de Node.js, npm, banco de dados ou processo de build.

Na raiz do projeto, prepare o kit se a pasta `.landing-tools` ainda não existir.
Com a skill `landing-from-images` instalada no destino pessoal padrão, execute no
PowerShell:

```powershell
$skillTools = Join-Path $env:USERPROFILE '.agents\skills\landing-from-images\tools'
Copy-Item -LiteralPath $skillTools -Destination '.landing-tools' -Recurse
npm.cmd ci --prefix .landing-tools
Push-Location .landing-tools
npx.cmd playwright install chromium
Pop-Location
```

Se a skill estiver em um destino personalizado, ajuste `$skillTools`. A instalação
das bibliotecas e do Chromium precisa de acesso à rede. A pasta `.landing-tools`
fica dentro deste projeto e é ignorada pelo Git.

Para iniciar a prévia, na raiz do projeto, use CMD ou PowerShell:

```text
node .landing-tools/serve.mjs --root . --port 4173
```

Abra [http://127.0.0.1:4173](http://127.0.0.1:4173). Encerre o servidor com `Ctrl+C`.

## Contato e configuração

O número comercial está centralizado em
[`assets/js/business.js`](assets/js/business.js), no campo `whatsappNumber`.
Ele permanece vazio nesta demonstração. Quando houver um número real, preencha
somente os dígitos, incluindo DDI e DDD.

Enquanto esse dado não for informado, os CTAs conduzem ao formulário e o botão
de continuação abre uma prévia local. A pessoa pode revisar, editar e copiar a
mensagem; a interface informa que nada foi enviado. Com um número válido
configurado, a prévia oferece a abertura do WhatsApp, onde o envio continua sendo
uma ação da própria pessoa.

Por exemplo: escolher **Consultar serviço** no card **Tosa** leva ao contato com
**Tosa** selecionada. **Solicitar localização** inclui esse pedido na mensagem.

Ainda precisam ser definidos pelo responsável: telefone comercial, endereço real
e horários de atendimento. O mapa é uma ilustração, sem coordenadas ou localização
real, e o rodapé identifica o projeto demonstrativo.

## Verificação

Na raiz do projeto, após preparar o kit:

```text
node --test tests/interactions.test.mjs
node .landing-tools/verify.mjs --root . --out .work/verification --desktop-width 1487 --desktop-height 1058 --scale 1 --config tests/verify.config.json
```

A suíte específica exercita menu, teclado, galeria, seleção de serviços, validação,
prévia e cópia da mensagem, navegação sem JavaScript e movimento reduzido. Os testes
bloqueiam requisições externas e não enviam mensagens reais.

O kit usa os seletores reais de [`tests/verify.config.json`](tests/verify.config.json),
captura a página e regiões em **1487, 768, 390 e 360 px**, espera fontes e imagens e
verifica overflow, âncoras, console e transições do menu. Os resultados ficam em
`.work/verification`. A comparação visual com as quatro referências é uma etapa
separada dos testes automáticos.

## Arquivos para publicação

Publique `index.html` e a pasta `assets/`, mantendo os caminhos relativos. As licenças
das fontes estão incluídas em `assets/fonts/`. Não publique `.landing-tools`,
`.work`, `node_modules`, caches ou relatórios temporários.

Os scripts e testes de desenvolvimento não são dependências de execução do site.
`funciona.txt`, que já existia no repositório, foi preservado.

Veja a [origem dos assets e as aproximações](docs/assets.md) e o
[registro dos recortes](docs/crops.json).
