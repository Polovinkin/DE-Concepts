# Data Engineering Concepts — podcast website

Static landing page for the Data Engineering Concepts podcast - first purely educational podcast about field of DE in English!

## Local preview for dev


Run in `Website Git` folder:
```bash
python3 -m http.server 8000 --bind localhost --directory dist
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

## Asset caching

After changing `dist/styles.css` or `dist/script.js`, update the corresponding
`?v=` value in `dist/index.html` to the first 12 characters of the file's SHA-256
hash (`shasum -a 256 dist/styles.css dist/script.js`). This gives each release a
fresh asset URL so browsers and Cloudflare do not reuse an older cached file.

