import { createWorker, PSM } from 'tesseract.js';

// Document categories and their keywords (based on your Python script)
const CATEGORIES = {
  "Aadhar": ["aadhar", "uidai", "govt of india", "government of india", "आधार"],
  "10th": ["10th", "class 10", "class x", "ssc", "high school", "हाई स्कूल", "दसवीं"],
  "12th": ["12th", "class 12", "class xii", "hsc", "senior secondary", "इंटरमीडिएट", "बारहवीं"],
  "Semester Marksheets": ["semester", "1st sem", "2nd sem", "3rd sem", "sgpa", "cgpa", "marks obtained"],
  "NPTEL": ["nptel", "motivated learners", "online certification", "discipline stars"],
  "Certificates": ["certificate", "completion", "recommendation", "achievement", "letter"]
};

interface ProcessingResult {
  category: string;
  confidence: number;
  ocrText: string;
}

export const processDocument = async (file: File): Promise<ProcessingResult> => {
  console.log(`📄 Processing: ${file.name}`);
  
  try {
    let ocrText = '';
    
    if (file.type === 'application/pdf') {
      // For PDFs, we'll extract text using a simplified approach
      // In a real implementation, you'd use pdf.js or similar
      ocrText = await extractTextFromPDF(file);
    } else if (file.type.startsWith('image/')) {
      // For images, use Tesseract.js
      ocrText = await extractTextFromImage(file);
    }
    
    console.log(`📝 OCR Preview: ${ocrText.slice(0, 200).replace(/\n/g, ' ')}`);
    
    const category = classifyDocument(ocrText);
    
    if (category) {
      console.log(`✅ Classified as: ${category}`);
      return {
        category: category,
        confidence: 1.0, // Full confidence when we find a match
        ocrText: ocrText
      };
    } else {
      console.log(`❌ Could not classify: ${file.name} → Unclassified`);
      return {
        category: 'Unclassified',
        confidence: 0,
        ocrText: ocrText
      };
    }
  } catch (error) {
    console.error(`⚠️ Error reading ${file.name}:`, error);
    return {
      category: 'Unclassified',
      confidence: 0,
      ocrText: 'Error processing document'
    };
  }
};

const extractTextFromImage = async (file: File): Promise<string> => {
  const worker = await createWorker('eng+hin');
  
  try {
    // Configure OCR similar to your Python script (--psm 6)
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK, // PSM 6: Assume a single uniform block of text
    });
    
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    return text.toLowerCase();
  } catch (error) {
    await worker.terminate();
    throw error;
  }
};

const extractTextFromPDF = async (file: File): Promise<string> => {
  // Simplified PDF text extraction
  // In a real implementation, you'd use pdf.js to convert PDF pages to images
  // and then run OCR on those images
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // This is a very basic text extraction - in reality you'd need pdf.js
      const text = result.replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, ' ').toLowerCase();
      resolve(text);
    };
    reader.readAsText(file);
  });
};

// Classification logic matching your Python script exactly
const classifyDocument = (text: string): string | null => {
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return category; // Return immediately on first match (like Python script)
      }
    }
  }
  return null; // Return null if no category found (like Python script)
};
