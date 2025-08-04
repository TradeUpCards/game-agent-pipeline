# Scraper Debugging Todo List

## High Priority
- [x] Create side-by-side comparison tool (iframe + scraped data)
- [ ] Analyze what content is being missed by scraper
- [ ] Compare original page vs scraped content for completeness
- [ ] Fix scraper to capture missing content types

## Medium Priority
- [ ] Identify CSS selectors that might be missing content types
- [ ] Test scraper improvements on sample pages

## Notes
Created debug tool at `/debug` in GUI that provides:
- Side-by-side comparison: original website (iframe) vs scraped content
- Toggle between raw scraped and parsed formats
- File and page selection from scraped data

Next step: Use the debug tool to systematically identify what content is being missed by comparing original pages with our scraped output.