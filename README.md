# booklist
Morten's list of books worth reading

An ultra-simple minimalist website for GitHub Pages showing a curated list of books.

## How It Works

The site is driven by the `books.md` file. When you update this file, the website automatically updates to reflect the changes.

## Markdown Format

The `books.md` file uses a structured format:

```markdown
# Main Title

## Section Title

Section description goes here.

### Book Title
- Author: Author Name
- ISBN: 9780123456789
- Image: https://example.com/cover.jpg
- Links:
  - [Link Text](https://example.com/link)
  - [Another Link](https://example.com/another)
- Note: Your thoughts about the book.
```

### Features

- **Sections with Titles and Descriptions**: Use `##` for section titles and add a description on the next line
- **Auto-generated Links**: ISBN numbers automatically generate links to:
  - Bookshop.org
  - IndieBound Canada (indiebookstores.ca)
- **Custom Links**: Add any additional links (libro.fm, etc.) under the `Links:` section
- **Book Images**: Display cover images using the `Image:` field
- **Notes**: Add your personal thoughts or summaries

## GitHub Pages Setup

1. Go to your repository Settings
2. Navigate to Pages
3. Under "Source", select the main branch
4. The site will be published at `https://[username].github.io/booklist/`

## Local Development

To test the site locally:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.
