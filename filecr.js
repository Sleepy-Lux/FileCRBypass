(function () {
	const versionInfo = {
		id: 'ddgilliopjknmglnpkegbjpoilgachlm',
		version: '9.9.9',
	};
 
	if (!document.cookie.includes('extensionIsInstalled')) {
		document.cookie = 'extensionIsInstalled=true; expire=Fri, 01 Jan 2077 00:00:00 GMT';
	}
 
	window.addEventListener(
		'message',
		event => {
			const data = {
				direction: 'from-content-script',
				responseFor: event.data.id,
				type: 'response',
			};
			if (event.data.id === 'install-check') {
				data.data = null;
				window.postMessage(data);
				return;
			}
 
			switch (event.data.action) {
				case 'app.info': {
					data.data = versionInfo;
					break;
				}
 
				case 'downloads.extractLink': {
					data.data = event.data.data.url;
					break;
				}
 
				case 'favorites.has': {
					data.data = false;
					break;
				}
 
				default: {
					return;
				}
			}
 
			window.postMessage(data);
		},
	);
 
	async function getLinks(meta) {
		if (['Torrent', 'Internal'].includes(meta.type)) {
			return fetch(`/api/actions/downloadlink/?id=${meta.id}`)
				.then(data => data.json())
				.then(json => ({provider: meta.type, url: json.url}));
		}
 
		return fetch(`https://filecr.com/api/actions/worker/?link_id=${meta.id}`)
			.then(data => data.json())
			.then(json => ({provider: json.download_provider, url: json.url}));
	}
 
	async function displayLinks(json) {
		if (document.querySelector('#link-field')) {
			return;
		}
 
		const trigger = document.querySelector('#trigger');
		const div = document.createElement('div');
		div.id = 'link-field';
		document.querySelector('.download-info').append(div);
		trigger.innerHTML = 'Loading...';
		const linksMeta = json.props.pageProps.post.downloads[0].links;
		const downloadLinks = await Promise.all(linksMeta.map(meta => getLinks(meta)));
		for (const [i, link] of downloadLinks.entries()) {
			const a = document.createElement('a');
			a.href = link.url;
			a.classList.add('link-light');
			a.innerHTML = `Link ${i + 1} (${link.provider})\n`;
			div.append(a);
		}
 
		trigger.innerHTML = 'COMPLETE!';
	}
 
	let reloaded = false;
	function addTrigger() {
		if (document.querySelector('.e-404') && !reloaded) {
			reloaded = true;
			window.location.reload();
		}
 
		if (!document.querySelector('.download-info') || document.querySelector('#trigger')) {
			return;
		}
 
		const rawJSON = JSON.parse(document.querySelector('#__NEXT_DATA__').textContent);
		const a = document.createElement('a');
		a.id = 'trigger';
		a.innerHTML = 'GET DOWNLOAD LINKS';
		a.classList.add('link-light');
		if (window.location.pathname.includes(rawJSON.query.postSlug)) {
			a.addEventListener('click', () => displayLinks(rawJSON));
		} else {
			a.addEventListener('click', () => window.location.reload());
			a.innerHTML += '<br>(Data mismatch. Reload is required.)';
		}
 
		document.querySelector('.download-info').append(a);
	}
 
	addTrigger();
	if (window.onurlchange === null) {
		window.addEventListener('urlchange', () => addTrigger());
	} else {
		const observer = new MutationObserver(() => addTrigger());
		observer.observe(document.head, {childList: true});
	}
})();