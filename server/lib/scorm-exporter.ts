import JSZip from 'jszip';
import { CourseWithModulesAndLessons } from '../../shared/schema';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Hard-coded API contents if file reading fails
const DEFAULT_API_JS = `/* SCORM API Implementation */
let API = null;

function initializeAPI() {
  API = {
    initialized: false,
    cmi: {
      completion_status: "not attempted",
      success_status: "unknown",
      score: { scaled: 0 }
    },
    
    Initialize: function(param) {
      console.log("SCORM API Initialize called");
      this.initialized = true;
      return "true";
    },
    
    Terminate: function(param) {
      console.log("SCORM API Terminate called");
      this.initialized = false;
      return "true";
    },
    
    GetValue: function(element) {
      console.log("SCORM API GetValue called for: " + element);
      
      // Parse the element path to access the nested property
      const path = element.split('.');
      let value = this.cmi;
      
      for (let i = 1; i < path.length; i++) {
        if (value[path[i]] !== undefined) {
          value = value[path[i]];
        } else {
          console.error("Element not found: " + element);
          return "";
        }
      }
      
      return String(value);
    },
    
    SetValue: function(element, value) {
      console.log("SCORM API SetValue called for: " + element + " with value: " + value);
      
      // Parse the element path to access the nested property
      const path = element.split('.');
      let target = this.cmi;
      
      for (let i = 1; i < path.length - 1; i++) {
        if (target[path[i]] === undefined) {
          target[path[i]] = {};
        }
        target = target[path[i]];
      }
      
      // Set the value
      if (path.length > 1) {
        target[path[path.length - 1]] = value;
      }
      
      return "true";
    },
    
    Commit: function(param) {
      console.log("SCORM API Commit called");
      return "true";
    },
    
    GetLastError: function() {
      return "0"; // No error
    },
    
    GetErrorString: function(errorCode) {
      return "No error";
    },
    
    GetDiagnostic: function(errorCode) {
      return "No diagnostic information available";
    }
  };
  
  // Make API globally available
  window.API_1484_11 = API;
  return API;
}`;

const DEFAULT_CSS = `
/* Main Course Styles */
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  color: #333;
  line-height: 1.6;
}

.course-container, .lesson-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

/* Headers */
.course-header, .lesson-header {
  margin-bottom: 30px;
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;
}

.course-header h1, .lesson-header h1 {
  font-size: 2.5em;
  margin-bottom: 10px;
  color: #2c3e50;
}

.lesson-info {
  font-size: 0.9em;
  color: #7f8c8d;
}

/* Navigation */
.module-navigation {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.module-navigation ul {
  list-style-type: none;
  padding-left: 0;
}

.module-navigation li {
  margin-bottom: 10px;
}

.module-navigation h3 {
  margin-bottom: 10px;
  color: #2c3e50;
}

/* Content */
.course-content, .lesson-content {
  line-height: 1.8;
}

.lesson-content h2 {
  margin-top: 30px;
  color: #2c3e50;
}

.lesson-content p {
  margin-bottom: 20px;
}

/* Footer */
.course-footer, .lesson-footer {
  margin-top: 50px;
  border-top: 1px solid #eee;
  padding-top: 20px;
  color: #7f8c8d;
}

.lesson-navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}

button:hover {
  background-color: #2980b9;
}

/* Responsive */
@media (max-width: 768px) {
  .course-container, .lesson-container {
    padding: 15px;
  }
  
  .course-header h1, .lesson-header h1 {
    font-size: 2em;
  }
}
`;

export async function generateSCORMPackage(course: CourseWithModulesAndLessons): Promise<Buffer> {
  console.log('Generating SCORM 2004 package for course:', course.title);
  
  // Create a new JSZip instance
  const zip = new JSZip();
  
  // Add SCORM manifest file
  const manifestXML = generateManifestXML(course);
  zip.file('imsmanifest.xml', manifestXML);
  
  // We'll skip the schema files since they're optional for basic SCORM functionality
  
  // Generate index.html (main entry point)
  const indexHTML = generateIndexHTML(course);
  zip.file('index.html', indexHTML);
  
  // Generate a folder for each module
  course.modules.forEach((module, moduleIndex) => {
    const moduleFolderName = `module_${moduleIndex + 1}`;
    zip.folder(moduleFolderName);
    
    // Generate HTML files for each lesson
    module.lessons.forEach((lesson, lessonIndex) => {
      const lessonHTML = generateLessonHTML(course, module, lesson);
      const lessonPath = `${moduleFolderName}/lesson_${lessonIndex + 1}.html`;
      zip.file(lessonPath, lessonHTML);
    });
  });
  
  // Add required JavaScript API adapters and CSS
  try {
    // Try to read from files first
    const apiJsPath = path.resolve(__dirname, '../templates/scorm/scripts/api.js');
    const cssPath = path.resolve(__dirname, '../templates/scorm/styles/main.css');
    
    if (fs.existsSync(apiJsPath)) {
      zip.file('scripts/api.js', fs.readFileSync(apiJsPath));
    } else {
      zip.file('scripts/api.js', DEFAULT_API_JS);
    }
    
    if (fs.existsSync(cssPath)) {
      zip.file('styles/main.css', fs.readFileSync(cssPath));
    } else {
      zip.file('styles/main.css', DEFAULT_CSS);
    }
  } catch (error) {
    console.error('Error reading template files:', error);
    // Use defaults if file reading fails
    zip.file('scripts/api.js', DEFAULT_API_JS);
    zip.file('styles/main.css', DEFAULT_CSS);
  }
  
  // Generate the zip file as a buffer
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  return zipBuffer;
}

function generateManifestXML(course: CourseWithModulesAndLessons): string {
  const courseId = `course_${course.id}`;
  const orgId = `org_${course.id}`;
  
  // Create organization items (modules and lessons)
  let organizationItems = '';
  let resources = '';
  
  course.modules.forEach((module, moduleIndex) => {
    const moduleId = `module_${moduleIndex + 1}`;
    
    // Add module as an item
    organizationItems += `
      <item identifier="${moduleId}" identifierref="">
        <title>${module.title}</title>`;
    
    // Add lessons as sub-items
    module.lessons.forEach((lesson, lessonIndex) => {
      const lessonId = `lesson_${moduleIndex + 1}_${lessonIndex + 1}`;
      const resourceId = `resource_${lessonId}`;
      
      organizationItems += `
        <item identifier="${lessonId}" identifierref="${resourceId}">
          <title>${lesson.title}</title>
          <adlcp:completionThreshold>0.75</adlcp:completionThreshold>
        </item>`;
      
      // Add lesson resource
      resources += `
      <resource identifier="${resourceId}" type="webcontent" adlcp:scormType="sco" href="module_${moduleIndex + 1}/lesson_${lessonIndex + 1}.html">
        <file href="module_${moduleIndex + 1}/lesson_${lessonIndex + 1}.html" />
        <dependency identifierref="common_files" />
      </resource>`;
    });
    
    // Close module item
    organizationItems += `
      </item>`;
  });
  
  // Add common files resource
  resources += `
    <resource identifier="common_files" type="webcontent" adlcp:scormType="asset">
      <file href="scripts/api.js" />
      <file href="styles/main.css" />
    </resource>`;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
          xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3"
          xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3"
          xmlns:imsss="http://www.imsglobal.org/xsd/imsss"
          identifier="${courseId}"
          version="1"
          xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd
                              http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd
                              http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd
                              http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd
                              http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 4th Edition</schemaversion>
    <adlcp:location>metadata.xml</adlcp:location>
  </metadata>
  <organizations default="${orgId}">
    <organization identifier="${orgId}" structure="hierarchical">
      <title>${course.title}</title>
      ${organizationItems}
    </organization>
  </organizations>
  <resources>
    ${resources}
  </resources>
</manifest>`;
}

function generateIndexHTML(course: CourseWithModulesAndLessons): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${course.title}</title>
  <link rel="stylesheet" href="styles/main.css">
  <script src="scripts/api.js"></script>
</head>
<body>
  <div class="course-container">
    <header class="course-header">
      <h1>${course.title}</h1>
      <p>${course.description || ''}</p>
    </header>
    
    <main class="course-content">
      <h2>Course Modules</h2>
      <nav class="module-navigation">
        <ul>
          ${course.modules.map((module, moduleIndex) => `
            <li>
              <h3>Module ${moduleIndex + 1}: ${module.title}</h3>
              <ul>
                ${module.lessons.map((lesson, lessonIndex) => `
                  <li>
                    <a href="module_${moduleIndex + 1}/lesson_${lessonIndex + 1}.html">${lesson.title}</a>
                  </li>
                `).join('')}
              </ul>
            </li>
          `).join('')}
        </ul>
      </nav>
    </main>
    
    <footer class="course-footer">
      <p>Click on a lesson to begin your learning journey!</p>
    </footer>
  </div>
  
  <script>
    window.onload = function() {
      // Initialize SCORM API
      initializeAPI();
    };
  </script>
</body>
</html>`;
}

function generateLessonHTML(course: CourseWithModulesAndLessons, module: any, lesson: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${lesson.title} - ${course.title}</title>
  <link rel="stylesheet" href="../styles/main.css">
  <script src="../scripts/api.js"></script>
</head>
<body>
  <div class="lesson-container">
    <header class="lesson-header">
      <h1>${lesson.title}</h1>
      <p class="lesson-info">
        <span class="course-title">${course.title}</span> > 
        <span class="module-title">${module.title}</span>
      </p>
    </header>
    
    <main class="lesson-content">
      ${lesson.content || `<p>No content has been added for this lesson yet.</p>`}
    </main>
    
    <footer class="lesson-footer">
      <div class="lesson-navigation">
        <button onclick="window.location.href='../index.html'">Back to Course</button>
      </div>
    </footer>
  </div>
  
  <script>
    window.onload = function() {
      // Initialize SCORM API
      initializeAPI();
      // Set lesson status as incomplete initially
      API.setValue("cmi.completion_status", "incomplete");
      // Listen for user activity
      setTimeout(function() {
        // After some time, mark as completed
        API.setValue("cmi.completion_status", "completed");
        API.setValue("cmi.success_status", "passed");
        API.setValue("cmi.score.scaled", "1.0");
        API.commit();
      }, 60000); // 60 seconds
    };
  </script>
</body>
</html>`;
}