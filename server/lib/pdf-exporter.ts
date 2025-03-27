import { CourseWithModulesAndLessons } from '../../shared/schema';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import puppeteer from 'puppeteer';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Explicitly define the type for our PDF buffer
type PDFResult = Buffer | Uint8Array;

// Default CSS for PDF
const DEFAULT_PDF_CSS = `
body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.pdf-container {
  margin-bottom: 50px;
}

.course-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.course-header h1 {
  font-size: 28px;
  color: #2c3e50;
  margin-bottom: 10px;
}

.course-description {
  font-style: italic;
  color: #7f8c8d;
  margin-bottom: 20px;
}

.course-toc {
  margin-bottom: 40px;
  page-break-after: always;
}

.course-toc h2 {
  font-size: 22px;
  margin-bottom: 20px;
  color: #2c3e50;
}

.toc-list {
  padding-left: 20px;
}

.toc-module {
  font-weight: bold;
  margin-bottom: 10px;
  color: #34495e;
}

.toc-lessons {
  padding-left: 20px;
}

.toc-lessons li {
  margin-bottom: 5px;
  color: #7f8c8d;
}

.module {
  margin-bottom: 30px;
  page-break-after: always;
}

.module-title {
  font-size: 24px;
  color: #2c3e50;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.module-description {
  margin-bottom: 20px;
  color: #7f8c8d;
}

.lesson {
  margin-bottom: 30px;
}

.lesson-title {
  font-size: 20px;
  color: #3498db;
  margin-bottom: 15px;
}

.lesson-content {
  margin-bottom: 20px;
}

.lesson-content h1, .lesson-content h2, .lesson-content h3 {
  color: #2c3e50;
}

.lesson-content p {
  margin-bottom: 15px;
}

.lesson-content ul, .lesson-content ol {
  margin-bottom: 15px;
  padding-left: 20px;
}

.lesson-content img {
  max-width: 100%;
  height: auto;
  margin: 15px 0;
}

.course-footer {
  margin-top: 50px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  text-align: center;
  color: #7f8c8d;
  font-size: 14px;
}

.page-number {
  text-align: center;
  font-size: 12px;
  color: #95a5a6;
  margin-top: 20px;
}

@media print {
  .module {
    page-break-after: always;
  }
  
  .lesson {
    page-break-inside: avoid;
  }
}
`;

export async function generatePDFPackage(course: CourseWithModulesAndLessons): Promise<Buffer> {
  console.log('Generating PDF for course:', course.title);
  
  try {
    // Generate the HTML content for the course
    const htmlContent = generateCourseHTML(course);
    
    // Launch a headless browser using system-installed Chromium
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--headless'],
      headless: true,
      executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium'
    });
    
    try {
      const page = await browser.newPage();
      
      // Set content and wait for it to load
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Add CSS to the page
      await page.addStyleTag({ content: DEFAULT_PDF_CSS });
      
      // Generate the PDF
      const pdfBuffer: PDFResult = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="width: 100%; text-align: center; font-size: 10px; color: #999; padding: 0 20px;">
            <span class="pageNumber"></span> of <span class="totalPages"></span>
          </div>
        `
      });
      
      // Always return as Buffer
      if (Buffer.isBuffer(pdfBuffer)) {
        return pdfBuffer;
      } else {
        return Buffer.from(pdfBuffer);
      }
    } finally {
      // Make sure to close the browser
      await browser.close();
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

function generateCourseHTML(course: CourseWithModulesAndLessons): string {
  // Create the HTML header and course title
  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${course.title}</title>
    </head>
    <body>
      <div class="pdf-container">
        <header class="course-header">
          <h1>${course.title}</h1>
          <div class="course-description">${course.description || ''}</div>
        </header>
        
        <div class="course-toc">
          <h2>Table of Contents</h2>
          <ol class="toc-list">
  `;
  
  // Add table of contents
  course.modules.forEach((module, moduleIndex) => {
    html += `
            <li>
              <div class="toc-module">${module.title}</div>
              <ol class="toc-lessons">
    `;
    
    module.lessons.forEach((lesson) => {
      html += `
                <li>${lesson.title}</li>
      `;
    });
    
    html += `
              </ol>
            </li>
    `;
  });
  
  // Close table of contents and start course content
  html += `
          </ol>
        </div>
        
        <div class="course-content">
  `;
  
  // Add each module and lesson content
  course.modules.forEach((module, moduleIndex) => {
    html += `
          <section class="module" id="module-${moduleIndex + 1}">
            <h2 class="module-title">Module ${moduleIndex + 1}: ${module.title}</h2>
            <div class="module-description">${module.description || ''}</div>
    `;
    
    // Add each lesson
    module.lessons.forEach((lesson, lessonIndex) => {
      html += `
            <section class="lesson" id="lesson-${moduleIndex + 1}-${lessonIndex + 1}">
              <h3 class="lesson-title">${lesson.title}</h3>
              <div class="lesson-content">
                ${lesson.content || '<p>No content has been added for this lesson yet.</p>'}
              </div>
            </section>
      `;
    });
    
    // Close module section
    html += `
          </section>
    `;
  });
  
  // Close HTML document
  html += `
        </div>
        
        <footer class="course-footer">
          <div class="footer-content">
            <p>Generated by elearngenie.ai</p>
            <p class="page-number"></p>
          </div>
        </footer>
      </div>
      
      <script>
        // Add page numbers (this won't execute during PDF generation,
        // but is included for completeness)
        document.querySelectorAll('.page-number').forEach((el, i) => {
          el.textContent = 'Page ' + (i + 1);
        });
      </script>
    </body>
    </html>
  `;
  
  return html;
}