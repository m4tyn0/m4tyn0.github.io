# matejcoufal.com

Personal portfolio — software developer & gastronomy consultant.

## Stack

Static site on GitHub Pages (Jekyll). Content is markdown pages under a shared `_layouts/portfolio.html`.

## Local preview

Requires a modern Ruby (3.x) or Docker:

```bash
# Docker (recommended if system Ruby is old)
docker run --rm -v "$PWD":/srv/jekyll -p 4000:4000 jekyll/jekyll:4.2.2 jekyll serve --host 0.0.0.0

# Or with Bundler on Ruby 3+
bundle install
bundle exec jekyll serve
```

Open http://127.0.0.1:4000

## Post-deploy SEO checklist

1. Verify the domain in [Google Search Console](https://search.google.com/search-console)
2. Submit `https://matejcoufal.com/sitemap.xml`
3. Spot-check social previews (LinkedIn / Facebook debugger) and Rich Results for the Person JSON-LD
