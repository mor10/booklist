// Fetch and parse the books.md file
async function loadBooks() {
    try {
        const response = await fetch('books.md');
        const text = await response.text();
        parseAndRenderBooks(text);
    } catch (error) {
        console.error('Error loading books:', error);
        document.getElementById('content').innerHTML = '<p>Error loading book list. Please ensure books.md exists and is accessible.</p>';
    }
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function parseAndRenderBooks(markdown) {
    const lines = markdown.split('\n');
    const content = document.getElementById('content');
    
    let html = '';
    let currentSection = null;
    let currentBook = null;
    let i = 0;
    
    while (i < lines.length) {
        const line = lines[i].trim();
        
        // Main title (h1)
        if (line.startsWith('# ')) {
            html += `<h1>${escapeHtml(line.substring(2))}</h1>`;
            i++;
        }
        // Section title (h2)
        else if (line.startsWith('## ')) {
            if (currentBook) {
                html += renderBook(currentBook);
                currentBook = null;
            }
            html += `<h2>${escapeHtml(line.substring(3))}</h2>`;
            currentSection = line.substring(3);
            i++;
            
            // Check for section description (next non-empty line that's not a heading or book)
            while (i < lines.length) {
                const nextLine = lines[i].trim();
                if (nextLine === '') {
                    i++;
                    continue;
                }
                if (nextLine.startsWith('#') || nextLine.startsWith('###')) {
                    break;
                }
                // This is the section description
                html += `<p class="section-description">${escapeHtml(nextLine)}</p>`;
                i++;
                break;
            }
        }
        // Book title (h3)
        else if (line.startsWith('### ')) {
            if (currentBook) {
                html += renderBook(currentBook);
            }
            currentBook = {
                title: line.substring(4),
                author: '',
                isbn: '',
                image: '',
                links: [],
                storeLinks: [], // Which store links to show: bookshop, indiebookstores, libro
                note: ''
            };
            i++;
        }
        // Book metadata
        else if (line.startsWith('- ') && currentBook) {
            if (line.startsWith('- Author: ')) {
                currentBook.author = line.substring(10);
            } else if (line.startsWith('- ISBN: ')) {
                currentBook.isbn = line.substring(8);
            } else if (line.startsWith('- Image: ')) {
                currentBook.image = line.substring(9);
            } else if (line.startsWith('- Note: ')) {
                currentBook.note = line.substring(8);
            } else if (line.startsWith('- Store Links: ')) {
                // Parse comma-separated list of store links
                const storesStr = line.substring(15).toLowerCase();
                currentBook.storeLinks = storesStr.split(',').map(s => s.trim());
            } else if (line.startsWith('- Links:')) {
                // Start collecting links
                i++;
                while (i < lines.length) {
                    const linkLine = lines[i];
                    const trimmedLinkLine = linkLine.trim();
                    if (linkLine.startsWith('  - ') || linkLine.startsWith('\t- ')) {
                        // Parse markdown link format [text](url)
                        const linkMatch = trimmedLinkLine.match(/\[([^\]]+)\]\(([^\)]+)\)/);
                        if (linkMatch) {
                            currentBook.links.push({
                                text: linkMatch[1],
                                url: linkMatch[2]
                            });
                        }
                        i++;
                    } else {
                        i--;
                        break;
                    }
                }
            }
            i++;
        }
        // Empty line or other content
        else {
            i++;
        }
    }
    
    // Render last book if exists
    if (currentBook) {
        html += renderBook(currentBook);
    }
    
    content.innerHTML = html;
}

function renderBook(book) {
    let html = '<div class="book">';
    
    // Image
    if (book.image) {
        html += `<div class="book-image"><img src="${escapeHtml(book.image)}" alt="${escapeHtml(book.title)} cover"></div>`;
    }
    
    html += '<div class="book-details">';
    
    // Title
    html += `<div class="book-title">${escapeHtml(book.title)}</div>`;
    
    // Author
    if (book.author) {
        html += `<div class="book-author">by ${escapeHtml(book.author)}</div>`;
    }
    
    // Links
    html += '<div class="book-links">';
    
    // Add auto-generated links from ISBN based on storeLinks configuration
    if (book.isbn) {
        // Clean and validate ISBN
        const cleanIsbn = book.isbn.replace(/[^0-9X]/gi, '');
        // Validate ISBN: 10 digits (optionally ending in X) or 13 digits
        const isValidIsbn10 = /^[0-9]{9}[0-9X]$/i.test(cleanIsbn);
        const isValidIsbn13 = /^[0-9]{13}$/.test(cleanIsbn);
        
        if (isValidIsbn10 || isValidIsbn13) {
            // Generate links based on storeLinks configuration
            if (book.storeLinks.includes('bookshop')) {
                html += `<a href="https://bookshop.org/book/${escapeHtml(cleanIsbn)}" target="_blank" rel="noopener">Bookshop.org</a>`;
            }
            if (book.storeLinks.includes('indiebookstores')) {
                html += `<a href="https://indiebookstores.org/book/${escapeHtml(cleanIsbn)}" target="_blank" rel="noopener">IndieBound</a>`;
            }
            if (book.storeLinks.includes('libro')) {
                html += `<a href="https://libro.fm/audiobooks/${escapeHtml(cleanIsbn)}" target="_blank" rel="noopener">Libro.fm</a>`;
            }
        }
    }
    
    // Add custom links
    book.links.forEach(link => {
        // Validate URL scheme to prevent javascript: URLs
        try {
            const url = new URL(link.url);
            if (url.protocol === 'http:' || url.protocol === 'https:') {
                html += `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.text)}</a>`;
            }
        } catch (e) {
            // Invalid URL, skip it
            console.warn('Invalid URL:', link.url);
        }
    });
    
    html += '</div>';
    
    // Note
    if (book.note) {
        html += `<div class="book-note">${escapeHtml(book.note)}</div>`;
    }
    
    html += '</div></div>';
    
    return html;
}

// Load books when page loads
document.addEventListener('DOMContentLoaded', loadBooks);
