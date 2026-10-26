# Origem dos assets

As quatro imagens fornecidas pelo usuário medem **1487 × 1058 px** e representam
partes consecutivas de uma única página. A ordem explícita prevalece sobre a ordem
de exibição dos anexos:

| Ordem | Referência | Conteúdo |
| --- | --- | --- |
| 1 | `mimo pet_ carinho em cada cuidado.png` | Hero e benefícios |
| 2 | `Cuidado completo para seu pet.png` | Serviços e sobre |
| 3 | `Um espaço acolhedor para pets.png` | Galeria e chamada de agendamento |
| 4 | `Contato e localização da Mimo Pet.png` | Fachada, contato, mapa e rodapé |

Os arquivos disponíveis não têm o sufixo `(1)` mencionado em parte do briefing.
Os originais foram preservados sem renomeação ou edição. As cópias de trabalho e
o mapa detalhado de referências ficam em `.work`, fora da publicação.

## Fotografias e recortes

As doze fotografias WebP em `assets/images/` foram extraídas das referências.
Não houve geração de novas fotografias. O arquivo [`crops.json`](crops.json)
registra, para cada asset, o nome e hash SHA-256 da origem, dimensões e retângulo
extraído em pixels.

Por exemplo, `hero-pets.webp` usa o retângulo de origem `x=741`, `y=95`,
`largura=746`, `altura=754` da primeira referência.

Os recortes dos cards excluem títulos, legendas e links. Na galeria, os recortes
evitam os controles de ampliação incorporados à imagem; os controles e as legendas
foram reconstruídos em HTML. Essa escolha estreita alguns enquadramentos em
relação à referência. O lightbox mostra as fotografias extraídas, sem inventar
resolução ou partes ausentes.

No hero e no banner da fachada, a porção limpa da fotografia foi combinada com
fundos e gradientes CSS. Isso preserva os personagens e permite texto real e
responsivo, mas aproxima a continuidade da cena nas áreas cobertas por texto na
referência. O letreiro presente na fotografia da fachada faz parte da própria cena.

## Marca, ícones e mapa

A marca no cabeçalho e no rodapé usa texto real com um coração SVG. Os ícones,
sublinhados coral e superfícies foram reconstruídos em SVG ou CSS. São aproximações
vetoriais da direção visual fornecida, sem uso das capturas como interface.

`illustrative-map.svg` é uma composição esquemática de ruas, áreas verdes e quadras.
Não representa endereço real e aparece identificado como **Mapa ilustrativo**.

## Tipografia

Conforme o briefing, títulos usam **Manrope** e textos e controles usam **Inter**.
As fontes variáveis estão hospedadas localmente em `assets/fonts/`, acompanhadas
das respectivas licenças SIL Open Font License:

| Família | Arquivo local | Origem | Licença local |
| --- | --- | --- | --- |
| Manrope | `Manrope-Variable.ttf` | [Google Fonts: Manrope](https://github.com/google/fonts/tree/main/ofl/manrope) | `Manrope-OFL.txt` |
| Inter | `Inter-Variable.ttf` | [Google Fonts: Inter](https://github.com/google/fonts/tree/main/ofl/inter) | `Inter-OFL.txt` |

O carregamento da página não depende de Google Fonts ou de outros servidores
externos. As quebras e dimensões finais devem ser avaliadas com essas fontes
carregadas; a tipografia da referência rasterizada não é uma identificação exata.

## Dados e adaptação

Não foram acrescentados preços, depoimentos, telefone ou endereço fictícios.
O layout mobile é derivado das referências desktop, com reorganização dos grids
e das fotografias. O conteúdo continua sendo uma página única, com um cabeçalho
e um rodapé, e as alturas acompanham seu conteúdo.
