// Keep the icon visible until the actual portrait decodes, including on failure.
export function portraitMarkup(config, className = '', size = 64) {
  const color = Number.isInteger(config.color) ? config.color.toString(16).padStart(6,'0') : '273252';
  const accent = Number.isInteger(config.accent) ? config.accent.toString(16).padStart(6,'0') : '273252';
  return `<div class="characterPortrait ${className}" style="width:${size}px;height:${size}px;background:linear-gradient(135deg,#${color},#${accent})" data-portrait="${config.id}">
    <span class="portraitFallback" aria-hidden="true">${config.icon || '👤'}</span>
    ${config.portrait ? `<img src="${config.portrait}" alt="${config.name}" decoding="async">` : ''}
  </div>`;
}

export function bindPortraits(root) {
  root.querySelectorAll('.characterPortrait img').forEach(img => {
    const settle = () => {
      const ready = img.complete && img.naturalWidth > 0;
      img.style.visibility = ready ? 'visible' : 'hidden';
      img.parentElement.dataset.assetState = ready ? 'ready' : 'error';
      img.previousElementSibling.style.visibility = ready ? 'hidden' : 'visible';
    };
    img.onload = settle;
    img.onerror = settle;
    if (img.complete) settle();
  });
}
