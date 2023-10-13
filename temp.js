document.documentElement.classList.add('js');

addEventListener('input', e => {
	let _t = e.target, 
			_p = _t.parentNode, 
			val = +_t.value, 
			_o = _p.querySelector(`option[value='${val}']`), 
			lbl = +_o.label;
	
	_t.setAttribute('aria-valuetext', lbl);
	_p.style.setProperty(`--${_t.id}`, val);
	_p.style.setProperty(`--lbl-${_t.id}`, lbl);
}, false);