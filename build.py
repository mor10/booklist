import os
import re
import glob

def parse_books_md(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    sections = []
    current_section = None
    current_book = None
    parsing_links = False

    for line in lines:
        line = line.strip()
        if not line:
            continue

        if line.startswith('## '):
            # New Section
            if current_book:
                if current_section:
                    current_section['books'].append(current_book)
                current_book = None
            
            section_title = line[3:].strip()
            current_section = {'title': section_title, 'description': '', 'books': []}
            sections.append(current_section)
            parsing_links = False
        
        elif line.startswith('### '):
            # New Book
            if current_book and current_section:
                current_section['books'].append(current_book)
            
            book_title = line[4:].strip()
            current_book = {
                'title': book_title,
                'subtitle': '',
                'author': '',
                'isbn': '',
                'pubdate': '',
                'links': [],
                'note': ''
            }
            parsing_links = False

        elif line.startswith('#### '):
            if current_book:
                current_book['subtitle'] = line[5:].strip()

        elif line.startswith('- Author:'):
            if current_book:
                current_book['author'] = line[9:].strip()

        elif line.startswith('- ISBN:'):
            if current_book:
                current_book['isbn'] = line[7:].strip()

        elif line.startswith('- Pubdate:'):
            if current_book:
                current_book['pubdate'] = line[10:].strip()

        elif line.startswith('- Store Links:'):
            parsing_links = True

        elif line.startswith('- Note:'):
            parsing_links = False
            if current_book:
                current_book['note'] = line[7:].strip()

        elif parsing_links and line.startswith('- '):
            if current_book:
                link_line = line[2:].strip()
                # Check for markdown link [text](url)
                md_link_match = re.match(r'\[(.*?)\]\((.*?)\)', link_line)
                if md_link_match:
                    text, url = md_link_match.groups()
                    current_book['links'].append({'text': text, 'url': url, 'custom_text': True})
                else:
                    # Raw URL
                    url = link_line
                    current_book['links'].append({'text': url, 'url': url, 'custom_text': False})
        
        elif current_section and not current_book and not line.startswith('#') and not line.startswith('-'):
             # Section description
             current_section['description'] += line + " "

    # Add last book
    if current_book and current_section:
        current_section['books'].append(current_book)

    return sections

def get_link_display(link_obj):
    url = link_obj['url']
    text = link_obj['text']
    custom = link_obj['custom_text']

    if 'bookshop.org' in url:
        return "Bookshop.org (US)"
    elif 'indiebookstores.ca' in url:
        return "Indie Bookstores (CA)"
    elif 'indiebookstores.org' in url:
        return "Indie Bookstores" # Fallback for .org if not specified, or maybe user meant this one.
    elif 'libro.fm' in url:
        return "Libro.fm Audiobook"
    
    if custom:
        return text
    
    return text # Fallback to URL or provided text

def find_image(isbn):
    base_path = 'book-thumbs'
    if not isbn:
        return f'{base_path}/placeholder.jpg'
    
    # Check for webp
    if os.path.exists(f'{base_path}/{isbn}.webp'):
        return f'{base_path}/{isbn}.webp'
    # Check for jpg
    if os.path.exists(f'{base_path}/{isbn}.jpg'):
        return f'{base_path}/{isbn}.jpg'
    
    return f'{base_path}/placeholder.jpg'

def generate_html(sections):
    html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Books Worth Reading</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <div class="container">
            <h1>Books Worth Reading</h1>
        </div>
    </header>
    <main class="container">
"""
    
    for section in sections:
        html += f"""
        <section class="book-section">
            <h2>{section['title']}</h2>
            {f'<p class="section-desc">{section["description"].strip()}</p>' if section['description'] else ''}
            <div class="book-list">
        """
        
        for book in section['books']:
            image_path = find_image(book['isbn'])
            html += f"""
                <article class="book-card">
                    <div class="book-image">
                        <img src="{image_path}" alt="Cover of {book['title']}" loading="lazy">
                    </div>
                    <div class="book-details">
                        <h3>{book['title']}</h3>
                        {f'<h4>{book["subtitle"]}</h4>' if book['subtitle'] else ''}
                        <p class="author">by {book['author']}</p>
                        <div class="meta">
                            <span class="pubdate">Published: {book['pubdate']}</span>
                            <span class="isbn">ISBN: {book['isbn']}</span>
                        </div>
                        <div class="links">
            """
            
            for link in book['links']:
                display_text = get_link_display(link)
                html += f'<a href="{link["url"]}" target="_blank" rel="noopener noreferrer" class="store-link">{display_text}</a>'
            
            html += """
                        </div>
                    </div>
                </article>
            """
        
        html += """
            </div>
        </section>
        """

    html += """
    </main>
    <footer>
        <div class="container">
            <p>Generated from books.md</p>
        </div>
    </footer>
</body>
</html>
"""
    return html

if __name__ == "__main__":
    sections = parse_books_md('books.md')
    html = generate_html(sections)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("index.html generated successfully.")
