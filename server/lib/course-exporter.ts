import { CourseWithModulesAndLessons } from '../../shared/schema';
import { generateSCORMPackage } from './scorm-exporter';
import { generateXAPIPackage } from './xapi-exporter';
import { generatePDFPackage } from './pdf-exporter';

export type ExportFormat = 'pdf' | 'scorm' | 'xapi';

export interface ExportOptions {
  format: ExportFormat;
  courseId: number;
}

export interface ExportResult {
  filename: string;
  buffer: Buffer;
  mimeType: string;
}

export async function exportCourse(
  course: CourseWithModulesAndLessons,
  format: ExportFormat
): Promise<ExportResult> {
  console.log(`Exporting course "${course.title}" in ${format.toUpperCase()} format`);
  
  let buffer: Buffer;
  let filename: string = '';
  let mimeType: string = '';
  
  // Generate a safe filename
  const safeTitle = course.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  try {
    switch (format) {
      case 'pdf':
        buffer = await generatePDFPackage(course);
        filename = `${safeTitle}.pdf`;
        mimeType = 'application/pdf';
        break;
        
      case 'scorm':
        buffer = await generateSCORMPackage(course);
        filename = `${safeTitle}-scorm.zip`;
        mimeType = 'application/zip';
        break;
        
      case 'xapi':
        buffer = await generateXAPIPackage(course);
        filename = `${safeTitle}-xapi.zip`;
        mimeType = 'application/zip';
        break;
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
    
    return {
      filename,
      buffer,
      mimeType
    };
  } catch (error: any) {
    console.error(`Error exporting course in ${format} format:`, error);
    const errorMessage = error.message || 'Unknown error';
    throw new Error(`Failed to export course in ${format} format: ${errorMessage}`);
  }
}