import JSZip from 'jszip';
import { CourseWithModulesAndLessons } from '../../shared/schema';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default CSS and JS if files can't be read
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

const DEFAULT_TINCAN_JS = `
/* TinCan API Implementation */
function TinCan(options) {
  this.activityId = options && options.activity ? options.activity.id : null;
  this.actor = {
    name: "Anonymous Learner",
    mbox: "mailto:anonymous@example.com"
  };
  
  this.sendStatement = function(statement) {
    console.log("xAPI statement sent:", statement);
    return true;
  };
  
  this.getState = function(id, actor, activity) {
    return null;
  };
  
  this.setState = function(id, val, actor, activity) {
    return true;
  };
  
  console.log("TinCan API initialized");
}
`;

export async function generateXAPIPackage(course: CourseWithModulesAndLessons): Promise<Buffer> {
  console.log('Generating xAPI package for course:', course.title);
  
  // Create a new JSZip instance
  const zip = new JSZip();
  
  // Add xAPI configuration file
  const tincanXML = generateTincanXML(course);
  zip.file('tincan.xml', tincanXML);
  
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
    const tincanJsPath = path.resolve(__dirname, '../templates/xapi/scripts/tincan.js');
    const cssPath = path.resolve(__dirname, '../templates/xapi/styles/main.css');
    
    if (fs.existsSync(tincanJsPath)) {
      zip.file('scripts/tincan.js', fs.readFileSync(tincanJsPath));
    } else {
      console.warn('Warning: Could not find tincan.js file, using default implementation');
      zip.file('scripts/tincan.js', DEFAULT_TINCAN_JS);
    }
    
    if (fs.existsSync(cssPath)) {
      zip.file('styles/main.css', fs.readFileSync(cssPath));
    } else {
      console.warn('Warning: Could not find main.css file, using default styling');
      zip.file('styles/main.css', DEFAULT_CSS);
    }
  } catch (error) {
    console.error('Error adding script/style files:', error);
    zip.file('scripts/tincan.js', DEFAULT_TINCAN_JS);
    zip.file('styles/main.css', DEFAULT_CSS);
  }
  
  try {
    // Generate the zip file as a buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    return zipBuffer;
  } catch (error) {
    console.error('Error generating zip file:', error);
    throw new Error('Failed to generate xAPI package');
  }
}

function generateTincanXML(course: CourseWithModulesAndLessons): string {
  // Generate activities for modules and lessons
  let activities = '';
  
  course.modules.forEach((module, moduleIndex) => {
    module.lessons.forEach((lesson, lessonIndex) => {
      const lessonId = `lesson_${moduleIndex + 1}_${lessonIndex + 1}`;
      
      activities += `
        <activity id="http://example.com/activities/${course.id}/${moduleIndex + 1}/${lessonIndex + 1}" type="http://adlnet.gov/expapi/activities/lesson">
          <name>${lesson.title}</name>
          <description>${module.title} - ${lesson.title}</description>
          <launch lang="en-US">module_${moduleIndex + 1}/lesson_${lessonIndex + 1}.html</launch>
        </activity>`;
    });
  });
  
  return `<?xml version="1.0" encoding="utf-8" ?>
<tincan xmlns="http://projecttincan.com/tincan.xsd">
  <activities>
    <activity id="http://example.com/activities/${course.id}" type="http://adlnet.gov/expapi/activities/course">
      <name>${course.title}</name>
      <description>${course.description || ''}</description>
      <launch lang="en-US">index.html</launch>
    </activity>
    ${activities}
  </activities>
</tincan>`;
}

function generateIndexHTML(course: CourseWithModulesAndLessons): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${course.title}</title>
  <link rel="stylesheet" href="styles/main.css">
  <script src="scripts/tincan.js"></script>
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
                    <a href="module_${moduleIndex + 1}/lesson_${lessonIndex + 1}.html" 
                       class="tincan-activity" 
                       data-activity-id="http://example.com/activities/${course.id}/${moduleIndex + 1}/${lessonIndex + 1}">
                      ${lesson.title}
                    </a>
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
      // Initialize xAPI
      var tincan = new TinCan({
        activity: {
          id: "http://example.com/activities/${course.id}",
          definition: {
            name: { "en-US": "${course.title}" },
            description: { "en-US": "${course.description || ''}" }
          }
        }
      });
      
      // Track course launch
      tincan.sendStatement({
        verb: {
          id: "http://adlnet.gov/expapi/verbs/launched",
          display: { "en-US": "launched" }
        },
        object: {
          id: "http://example.com/activities/${course.id}"
        }
      });
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
  <script src="../scripts/tincan.js"></script>
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
    // Track lesson variables
    var lessonId = "http://example.com/activities/${course.id}/${module.id}/${lesson.id}";
    var courseName = "${course.title}";
    var moduleName = "${module.title}";
    var lessonName = "${lesson.title}";
    
    window.onload = function() {
      // Initialize xAPI
      var tincan = new TinCan({
        activity: {
          id: lessonId,
          definition: {
            name: { "en-US": lessonName },
            description: { "en-US": moduleName + " - " + lessonName }
          }
        }
      });
      
      // Track lesson launch
      tincan.sendStatement({
        verb: {
          id: "http://adlnet.gov/expapi/verbs/launched",
          display: { "en-US": "launched" }
        },
        object: {
          id: lessonId
        }
      });
      
      // Track lesson viewed
      tincan.sendStatement({
        verb: {
          id: "http://id.tincanapi.com/verb/viewed",
          display: { "en-US": "viewed" }
        },
        object: {
          id: lessonId
        }
      });
      
      // After 60 seconds, track lesson completion
      setTimeout(function() {
        tincan.sendStatement({
          verb: {
            id: "http://adlnet.gov/expapi/verbs/completed",
            display: { "en-US": "completed" }
          },
          object: {
            id: lessonId
          },
          result: {
            completion: true,
            success: true,
            score: {
              scaled: 1.0
            }
          }
        });
      }, 60000);
    };
  </script>
</body>
</html>`;
}