import Tesseract from 'tesseract.js';

export async function recognizeText(imageUrl: string): Promise<string> {
    try {
        const result = await Tesseract.recognize(imageUrl, 'eng');
        return result.data.text;
    } catch (error) {
        console.error('OCR Error:', error);
        return '';
    }
}
