import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from '../.landing-tools/lib/browser.mjs';
import { startServer } from '../.landing-tools/serve.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
let server;
let browser;
before(async () => {
  server = await startServer({ root });
  ({ browser } = await launchBrowser());
});
after(async () => { await browser?.close(); await server?.close(); });

async function pageFor(t, options = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, ...options });
  const blocked = [];
  await context.route('**/*', route => {
    const request = route.request();
    if (new URL(request.url()).origin === server.url && ['GET', 'HEAD'].includes(request.method())) return route.continue();
    blocked.push({ url: request.url(), method: request.method() });
    return route.abort();
  });
  await context.routeWebSocket('**/*', socket => socket.close());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(8000);
  t.after(async () => {
    await context.close();
    assert.deepEqual(errors, [], 'Nenhum erro JavaScript durante o cenário');
    assert.deepEqual(blocked, [], 'Nenhuma tentativa de envio ou integração externa');
  });
  await page.goto(server.url, { waitUntil: 'load' });
  return page;
}

const isExpanded = page => page.locator('#menu-toggle').getAttribute('aria-expanded');
const runningMenu = page => page.locator('#site-nav').evaluate(element => element.getAnimations().filter(animation => animation.playState === 'running').length);
async function fillNames(page) {
  await page.locator('#owner-name').fill('Ana Silva');
  await page.locator('#pet-name').fill('Mel');
}

test('menu: entrada/saída animadas, reversão real, Escape, âncora e resize', { timeout: 45000 }, async t => {
  const page = await pageFor(t);
  const toggle = page.locator('#menu-toggle');
  const nav = page.locator('#site-nav');
  assert.equal(await isExpanded(page), 'false');
  assert.equal(await nav.evaluate(element => element.inert), true);
  await toggle.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(50);
  assert.equal(await isExpanded(page), 'true');
  assert.ok(await runningMenu(page) > 0, 'Abertura possui movimento real');
  await page.waitForTimeout(280);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(40);
  assert.ok(await runningMenu(page) > 0, 'Fechamento permanece animado');
  await page.waitForTimeout(280);
  assert.equal(await isExpanded(page), 'false');
  assert.equal(await toggle.evaluate(element => element === document.activeElement), true);
  assert.equal(await nav.evaluate(element => element.inert), true);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(50);
  assert.ok(await runningMenu(page) > 0);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(320);
  assert.equal(await isExpanded(page), 'true', 'Última intenção prevalece após reversão');
  await nav.locator('a[href="#servicos"]').click();
  await page.waitForTimeout(300);
  assert.equal(await isExpanded(page), 'false');
  assert.ok(page.url().endsWith('#servicos'));
  assert.equal(await page.evaluate(() => document.activeElement.id), 'servicos');
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await toggle.focus(); await page.keyboard.press('Enter');
  await page.setViewportSize({ width: 1200, height: 900 });
  assert.equal(await nav.evaluate(element => element.inert), false);
  assert.equal(await nav.getAttribute('aria-hidden'), null);
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).overflowY === 'hidden'), false);
  await page.setViewportSize({ width: 360, height: 800 });
  assert.equal(await isExpanded(page), 'false');
  assert.equal(await nav.evaluate(element => element.inert), true);
});

test('lightbox: três fotos, teclado, foco contido e devolvido ao fechar', { timeout: 45000 }, async t => {
  const page = await pageFor(t, { viewport: { width: 1488, height: 1058 } });
  const first = page.locator('a[data-gallery-index]').first();
  assert.equal(await page.locator('a[data-gallery-index]').count(), 3);
  await first.click();
  assert.equal(await page.locator('#lightbox').evaluate(element => element.open), true);
  assert.equal(await page.locator('#lightbox-count').textContent(), '1 de 3');
  for (let index = 0; index < 8; index++) {
    await page.keyboard.press(index % 2 ? 'Shift+Tab' : 'Tab');
    assert.equal(await page.locator('#lightbox').evaluate(element => element.contains(document.activeElement)), true);
  }
  await page.locator('#lightbox-next').click();
  assert.equal(await page.locator('#lightbox-count').textContent(), '2 de 3');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#lightbox-count').textContent(), '3 de 3');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('#lightbox-count').textContent(), '2 de 3');
  assert.ok(await page.locator('#lightbox-image').evaluate(image => image.complete && image.naturalWidth > 0));
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#lightbox').evaluate(element => element.open), false);
  assert.equal(await first.evaluate(element => element === document.activeElement), true);
  // O evento close do dialog é assíncrono: aguarda a liberação da rolagem em vez de checar na hora.
  await page.waitForFunction(() => getComputedStyle(document.body).overflowY !== 'hidden', null, { timeout: 2000 });
  await page.locator('#open-gallery').click();
  assert.equal(await page.locator('#lightbox-count').textContent(), '1 de 3');
  await page.locator('#lightbox-close').click();
  assert.equal(await page.locator('#open-gallery').evaluate(element => element === document.activeElement), true);
});

test('links de serviços selecionam o cuidado correspondente no contato', { timeout: 45000 }, async t => {
  const page = await pageFor(t, { viewport: { width: 1488, height: 1058 } });
  const links = page.locator('a[data-service]');
  const values = await links.evaluateAll(items => items.map(item => item.dataset.service));
  for (const expected of ['Banho', 'Tosa', 'Escovação', 'Corte de unhas', 'Hidratação', 'Produtos para pets']) assert.ok(values.includes(expected), expected);
  for (let index = 0; index < values.length; index++) {
    await links.nth(index).click();
    assert.equal(await page.locator('#care-service').inputValue(), values[index]);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'contato');
  }
});

test('formulário: valida espaços vazios e prepara mensagem revisável sem número fictício', { timeout: 45000 }, async t => {
  const page = await pageFor(t);
  await page.locator('#owner-name').fill('   ');
  await page.locator('#pet-name').fill('Mel');
  await page.locator('#prepare-message').click();
  assert.equal(await page.locator('#message-preview').evaluate(element => element.open), false);
  assert.equal(await page.locator('#owner-name').evaluate(element => element.validity.valid), false);
  await fillNames(page);
  await page.locator('#pet-kind').selectOption('Gato');
  await page.locator('#care-service').selectOption('Escovação');
  await page.locator('#pet-notes').fill('Pelagem longa. <img src=x onerror=alert(1)>');
  await page.locator('#prepare-message').click();
  assert.equal(await page.locator('#message-preview').evaluate(element => element.open), true);
  const message = await page.locator('#message-text').inputValue();
  assert.match(message, /Ana Silva/); assert.match(message, /Mel \(Gato\)/);
  assert.match(message, /Cuidado desejado: Escovação/);
  assert.match(message, /<img src=x onerror=alert\(1\)>/);
  assert.equal(await page.locator('#message-preview img').count(), 0, 'Dados não viram HTML');
  assert.equal(await page.locator('#whatsapp-link').isVisible(), false);
  assert.equal(await page.locator('#whatsapp-link').getAttribute('href'), null);
  assert.match(await page.locator('#message-demo').textContent(), /demonstrativo.*não foi informado/i);
  await page.locator('#message-text').fill('Mensagem revisada por mim.');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copiedMessage = text; } } }));
  await page.locator('#copy-message').click();
  assert.equal(await page.evaluate(() => window.__copiedMessage), 'Mensagem revisada por mim.');
  assert.match(await page.locator('#message-feedback').textContent(), /copiada.*Nenhuma mensagem foi enviada/);
  await page.locator('#message-close').click();
  assert.equal(await page.locator('#prepare-message').evaluate(element => element === document.activeElement), true);
});

test('localização é uma intenção demonstrativa; copiar tem fallback seguro', { timeout: 45000 }, async t => {
  const page = await pageFor(t);
  await page.locator('[data-intent="location"]').click();
  assert.match(await page.locator('#form-intent-status').textContent(), /localização e horários/);
  await fillNames(page);
  await page.locator('#prepare-message').click();
  assert.match(await page.locator('#message-text').inputValue(), /solicitar a localização e os horários/);
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied'); } } }));
  await page.locator('#copy-message').click();
  assert.match(await page.locator('#message-feedback').textContent(), /Ctrl\+C/);
  assert.equal(await page.locator('#message-text').evaluate(element => element.selectionEnd - element.selectionStart), (await page.locator('#message-text').inputValue()).length);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#message-preview').evaluate(element => element.open), false);
  await page.locator('#care-service').selectOption('Banho');
  assert.equal(await page.locator('#form-intent-status').textContent(), '');
});

test('sem JS e com movimento reduzido: conteúdo e navegação permanecem acessíveis', { timeout: 45000 }, async t => {
  const noJs = await pageFor(t, { javaScriptEnabled: false });
  assert.equal(await noJs.locator('h1').count(), 1);
  assert.equal(await noJs.locator('#site-nav').isVisible(), true);
  assert.equal(await noJs.locator('#prepare-message').isDisabled(), true);
  assert.equal(await noJs.locator('#menu-toggle').isVisible(), false);
  assert.equal(await noJs.locator('a[data-gallery-index]').count(), 3);
  assert.ok((await noJs.locator('a[data-gallery-index]').first().getAttribute('href')).endsWith('.webp'));
  for (const id of ['inicio', 'servicos', 'nosso-espaco', 'contato']) assert.equal(await noJs.locator(`#${id}`).count(), 1);
  const reduced = await pageFor(t, { reducedMotion: 'reduce' });
  await reduced.locator('#menu-toggle').click(); await reduced.waitForTimeout(100);
  assert.equal(await isExpanded(reduced), 'true');
  assert.equal(await runningMenu(reduced), 0);
  assert.equal(await reduced.locator('.hero-content').evaluate(element => getComputedStyle(element).opacity), '1');
  assert.equal(await reduced.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
});
